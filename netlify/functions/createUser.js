const admin = require('firebase-admin');

// Initialize Firebase Admin only once
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
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verify the request has a valid Firebase ID token (only admins can call this)
  const authHeader = event.headers.authorization || '';
  const idToken = authHeader.replace('Bearer ', '');

  if (!idToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  try {
    // Verify the caller is authenticated
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    // Check if caller is admin in Firestore
    const db = admin.firestore();
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }) };
    }

    const { email, password, displayName, role = 'student' } = JSON.parse(event.body);

    if (!email || !password || !displayName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos requeridos' }) };
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Create the user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      role,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        uid: userRecord.uid,
        message: 'Usuario creado exitosamente'
      }),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    const messages = {
      'auth/email-already-exists': 'Ya existe un usuario con ese correo.',
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
