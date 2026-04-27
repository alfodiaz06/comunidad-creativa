# 🎓 EduVault — Guía Completa de Instalación y Despliegue

Plataforma privada de cursos online tipo Hotmart, con autenticación Firebase,
gestión de usuarios, módulos, lecciones y videos de Google Drive.

---

## 📋 Requisitos previos

- Node.js 18+
- Cuenta en [Firebase](https://console.firebase.google.com)
- Cuenta en [Netlify](https://netlify.com)
- Cuenta en [Google Drive](https://drive.google.com) para los videos

---

## 🔥 PASO 1 — Configurar Firebase

### 1.1 Crear proyecto Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **"Crear proyecto"**
3. Ponle un nombre (ej: `eduvault-prod`)
4. Desactiva Google Analytics si no lo necesitas → **Crear proyecto**

### 1.2 Activar Authentication

1. Panel izquierdo → **Authentication** → **Comenzar**
2. Pestaña **Sign-in method**
3. Habilitar **Correo electrónico/contraseña** → Guardar

### 1.3 Crear Firestore Database

1. Panel izquierdo → **Firestore Database** → **Crear base de datos**
2. Selecciona **Modo producción**
3. Elige la región más cercana (ej: `us-central`)
4. Clic **Habilitar**

### 1.4 Configurar Reglas de Firestore

En Firestore → pestaña **Reglas**, reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuarios autenticados pueden leer su propio perfil
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Solo admins pueden leer todos los usuarios
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Cursos: lectura para autenticados, escritura solo admins
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      match /modules/{moduleId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

        match /lessons/{lessonId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && 
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        }
      }
    }

    // Progreso: cada usuario lee/escribe el suyo; admin lee todo
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Asignaciones de cursos
    match /assignments/{assignmentId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 1.5 Obtener credenciales del proyecto

1. Panel Firebase → ⚙️ **Configuración del proyecto** → **Tus apps**
2. Clic en icono web **`</>`**
3. Registra la app (nombre: `eduvault-web`)
4. Copia el objeto `firebaseConfig`

---

## 👤 PASO 2 — Crear el primer usuario administrador

Esto se hace **manualmente** en Firebase (la plataforma NO tiene registro público).

### 2.1 Crear cuenta en Firebase Auth

1. Firebase Console → **Authentication** → **Users** → **Añadir usuario**
2. Ingresa email y contraseña del admin
3. Copia el **UID** generado

### 2.2 Crear perfil admin en Firestore

1. Firestore → **Datos** → **Añadir colección**: `users`
2. ID del documento: pega el **UID** copiado
3. Añade estos campos:

```
displayName  (string)  →  "Administrador"
email        (string)  →  tu@email.com
role         (string)  →  admin
disabled     (boolean) →  false
createdAt    (timestamp) → (fecha actual)
```

### 2.3 Crear usuarios estudiantes

Para cada nuevo estudiante:
1. Firebase Auth → **Añadir usuario** → email + contraseña
2. Copia el UID
3. Crea documento en `users/{uid}` con:
   ```
   displayName  →  "Nombre del Estudiante"
   email        →  estudiante@email.com
   role         →  student
   disabled     →  false
   ```
4. Desde el **Panel Admin de la plataforma** puedes asignarle cursos

---

## 💻 PASO 3 — Configurar el proyecto localmente

### 3.1 Clonar / descargar el proyecto

```bash
# Descomprime el proyecto descargado
cd courseplatform
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Configurar variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y completa con tus datos de Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_ADMIN_EMAIL=admin@tudominio.com
```

### 3.4 Correr en desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` — inicia sesión con el admin creado.

---

## 🚀 PASO 4 — Desplegar en Netlify

### Opción A — Desde GitHub (recomendado)

1. Sube el proyecto a un repositorio GitHub
2. Ve a [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Conecta GitHub → selecciona el repositorio
4. Configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clic **Deploy site**

### Opción B — Deploy manual (arrastrar carpeta)

```bash
npm run build
```

1. Ve a Netlify → **Sites** → arrastra la carpeta `dist/` al área de drop

### 4.1 Configurar variables de entorno en Netlify

**CRÍTICO:** Las variables de `.env` NO se suben a Git. Debes configurarlas en Netlify:

1. Netlify → tu sitio → **Site configuration** → **Environment variables**
2. Añade **todas** las variables de `.env`:

```
VITE_FIREBASE_API_KEY          = AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN      = tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID       = tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET   = tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID           = 1:...
```

3. **Redeploy** el sitio para que tomen efecto

### 4.2 Configurar dominio autorizado en Firebase

1. Firebase → **Authentication** → **Configuración** → **Dominios autorizados**
2. Añade tu dominio de Netlify: `tu-sitio.netlify.app`
3. Si tienes dominio propio, añádelo también

---

## 🎬 PASO 5 — Configurar videos de Google Drive

Para cada video:

1. Sube el video a Google Drive
2. Clic derecho → **Compartir** → **Cambiar a cualquiera con el enlace**
3. Copia el enlace: `https://drive.google.com/file/d/ARCHIVO_ID/view`
4. Pégalo en la lección dentro del Panel Admin

El sistema convierte automáticamente el enlace a formato embed.

---

## 🗂️ Estructura de la base de datos

```
Firestore
├── users/{uid}
│   ├── displayName: string
│   ├── email: string
│   ├── role: "admin" | "student"
│   ├── disabled: boolean
│   └── createdAt: timestamp
│
├── courses/{courseId}
│   ├── title: string
│   ├── description: string
│   ├── emoji: string
│   ├── totalLessons: number
│   ├── createdAt: timestamp
│   └── modules/{moduleId}
│       ├── title: string
│       ├── order: number
│       └── lessons/{lessonId}
│           ├── title: string
│           ├── description: string
│           ├── videoUrl: string
│           ├── duration: string
│           └── order: number
│
├── assignments/{userId_courseId}
│   ├── userId: string
│   ├── courseId: string
│   └── assignedAt: timestamp
│
└── progress/{userId_courseId_lessonId}
    ├── userId: string
    ├── courseId: string
    ├── lessonId: string
    ├── completed: boolean
    └── completedAt: timestamp
```

---

## 🔧 Flujo de uso

### Como Administrador:
1. Login en `/login` con la cuenta admin
2. Se redirige a `/dashboard` → clic en **"Admin"** en la barra
3. En **Cursos**: crear cursos, añadir módulos y lecciones con URLs de Drive
4. En **Usuarios**: ver usuarios, asignar cursos, cambiar roles

### Como Estudiante:
1. Login en `/login` con sus credenciales (dadas por el admin)
2. Ver cursos asignados en el dashboard
3. Entrar a un curso → ver videos → marcar lecciones como completadas
4. El progreso se guarda automáticamente

---

## ❓ Preguntas frecuentes

**¿Puedo usar Vimeo o YouTube en vez de Google Drive?**
Sí, edita la función `toEmbedUrl` en `CoursePage.jsx` para manejar otros servicios.

**¿Cómo reseteo la contraseña de un usuario?**
Desde Firebase Console → Authentication → busca el usuario → ⋮ → "Reset password".

**¿Los videos de Drive son privados?**
Solo parcialmente. El iframe se puede ver si alguien accede directamente a la URL de Drive. Para protección real, usa Google Drive con dominio de organización o un servicio como Vimeo con embeds protegidos.

**¿Cómo añado más admins?**
En Firestore, cambia el campo `role` del usuario de `student` a `admin`.

**¿Puedo personalizar el nombre "EduVault"?**
Sí, busca "EduVault" en el proyecto y reemplázalo por el nombre de tu marca.

---

## 📦 Estructura del proyecto

```
src/
├── components/
│   ├── admin/
│   │   └── AdminNav.jsx          # Sidebar admin
│   ├── student/
│   │   └── StudentNav.jsx        # Navbar estudiante
│   └── shared/
│       ├── ProtectedRoute.jsx    # Protege rutas privadas
│       ├── AdminRoute.jsx        # Protege rutas de admin
│       └── LoadingScreen.jsx     # Pantalla de carga
├── contexts/
│   └── AuthContext.jsx           # Estado global de autenticación
├── lib/
│   ├── firebase.js               # Inicialización Firebase
│   └── db.js                     # Todas las operaciones Firestore
├── pages/
│   ├── LoginPage.jsx             # Página de login
│   ├── admin/
│   │   ├── AdminDashboard.jsx    # Dashboard admin
│   │   ├── AdminCourses.jsx      # Lista de cursos
│   │   ├── AdminCourseEditor.jsx # Editor de módulos/lecciones
│   │   └── AdminUsers.jsx        # Gestión de usuarios
│   └── student/
│       ├── StudentDashboard.jsx  # Dashboard estudiante
│       └── CoursePage.jsx        # Visor de curso con video
├── styles/
│   └── globals.css               # Estilos globales + Tailwind
└── App.jsx                       # Router principal
```
