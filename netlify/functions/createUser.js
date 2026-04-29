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
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }) };
    }

    const { email, password, displayName, role = 'student' } = JSON.parse(event.body);

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email y contraseña son requeridos' }) };
    }

    if (password.length < 6) {
      return { statusCode: 400, body: JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }) };
    }

    let userRecord;
    let wasExisting = false;

    try {
      // Try to get existing user first
      userRecord = await admin.auth().getUserByEmail(email);
      wasExisting = true;
      // Update password (and displayName if provided)
      const updateData = { password };
      if (displayName) updateData.displayName = displayName;
      await admin.auth().updateUser(userRecord.uid, updateData);
      console.log(`Updated existing user: ${email}, uid: ${userRecord.uid}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({ email, password, displayName: displayName || '' });
        console.log(`Created new user: ${email}, uid: ${userRecord.uid}`);
      } else {
        throw e;
      }
    }

    // Create or update Firestore profile
    const profileData = {
      email,
      role,
      disabled: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (displayName) profileData.displayName = displayName;
    if (!wasExisting) profileData.createdAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(userRecord.uid).set(profileData, { merge: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        uid: userRecord.uid,
        wasExisting,
        message: wasExisting ? 'Contraseña actualizada correctamente' : 'Usuario creado exitosamente',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    const messages = {
      'auth/invalid-email': 'El correo no es válido.',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres).',
      'auth/invalid-password': 'Contraseña inválida (mínimo 6 caracteres).',
    };
    return {
      statusCode: 400,
      body: JSON.stringify({ error: messages[error.code] || error.message || 'Error desconocido' }),
    };
  }
};
