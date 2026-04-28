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

  if (!idToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const db = admin.firestore();
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }) };
    }

    const { email, password, displayName, role = 'student' } = JSON.parse(event.body);

    if (!email || !password || !displayName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos requeridos' }) };
    }

    let userRecord;
    let wasExisting = false;

    try {
      // Try to create new user
      userRecord = await admin.auth().createUser({ email, password, displayName });
    } catch (createError) {
      if (createError.code === 'auth/email-already-exists') {
        // User exists in Auth — update their password and reuse
        wasExisting = true;
        userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password, displayName });
      } else {
        throw createError;
      }
    }

    // Create or update Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      role,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        uid: userRecord.uid,
        wasExisting,
        message: wasExisting
          ? 'Cuenta reactivada con nueva contraseña'
          : 'Usuario creado exitosamente'
      }),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    const messages = {
      'auth/invalid-email': 'El correo electrónico no es válido.',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
    };
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: messages[error.code] || error.message || 'Error al crear usuario'
      }),
    };
  }
};
