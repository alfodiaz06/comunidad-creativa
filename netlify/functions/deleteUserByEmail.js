const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');
  if (!idToken) return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const db = admin.firestore();
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo administradores' }) };
    }

    const { email, uid } = JSON.parse(event.body);

    let userUid = uid;

    // If no uid provided, look up by email
    if (!userUid && email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        userUid = userRecord.uid;
      } catch(e) {
        // User doesn't exist in Auth — nothing to delete
        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'User not found in Auth' }) };
      }
    }

    if (!userUid) {
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Nothing to delete' }) };
    }

    // Delete from Auth
    try { await admin.auth().deleteUser(userUid); } catch(e) { /* already deleted */ }

    // Delete from Firestore
    try { await db.collection('users').doc(userUid).delete(); } catch(e) { /* ignore */ }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
};
