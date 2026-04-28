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

    const { uid, email, password } = JSON.parse(event.body);
    if (!password || password.length < 6) {
      return { statusCode: 400, body: JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }) };
    }

    let userUid = uid;

    // If no uid, find by email
    if (!userUid && email) {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        userUid = userRecord.uid;
      } catch(e) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Usuario no encontrado en Firebase Auth' }) };
      }
    }

    if (!userUid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Se requiere uid o email' }) };
    }

    await admin.auth().updateUser(userUid, { password });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }),
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message || 'Error al actualizar contraseña' }),
    };
  }
};
