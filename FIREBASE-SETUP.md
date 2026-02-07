# Crear proyecto Firebase nuevo y conectar esta app

Sigue estos pasos en orden. Cuando termines, pega la config en `.env.local`.

---

## 1. Crear el proyecto en Firebase

1. Entra a **https://console.firebase.google.com/**
2. Clic en **"Crear un proyecto"** (o **"Agregar proyecto"**).
3. **Nombre del proyecto:** pon uno, por ejemplo `sistema-gestion`.
4. Acepta (o desactiva) Google Analytics si quieres.
5. Clic en **"Crear proyecto"** y espera a que termine.

---

## 2. Registrar la app web

1. En la página del proyecto, verás **"Comienza agregando Firebase a tu aplicación"**.
2. Clic en el ícono **`</>`** (Web).
3. **Apodo de la app:** por ejemplo `Sistema Gestion`.
4. No marques "Firebase Hosting" por ahora (opcional).
5. Clic en **"Registrar app"**.
6. Te mostrará un bloque de código con algo como:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto-id",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:xxxxx",
     measurementId: "G-XXXXX"
   };
   ```
7. **Copia esos valores** (los usarás en el paso 5). Puedes cerrar esa ventana o hacer clic en "Siguiente" hasta terminar.

---

## 3. Activar Firestore

1. En el menú izquierdo: **"Compilación"** → **"Firestore Database"**.
2. Clic en **"Crear base de datos"**.
3. **Modo:** elige **"Modo de producción"** (luego ajustamos reglas) o **"Modo de prueba"** (permite leer/escribir por unos días).
4. **Ubicación:** elige la más cercana (ej. `southamerica-east1`).
5. Clic en **"Habilitar"** y espera.

---

## 4. Reglas de Firestore (para que la app pueda leer y escribir)

1. Sigue en **Firestore Database** → pestaña **"Reglas"**.
2. Sustituye todo el contenido por esto (solo para desarrollo; en producción deberías restringir por usuario):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

3. Clic en **"Publicar"**.

---

## 5. Poner la config en esta app

1. Abre el archivo **`.env.local`** en la raíz de este proyecto (SISTEMA GESTION).
2. Sustituye los valores por los que copiaste en el paso 2. Debe quedar así (con **tus** datos):

   ```
   NEXT_PUBLIC_USE_FIREBASE=true
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key-aqui
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXX
   ```

   Cada variable debe tener **el valor exacto** que te dio Firebase (sin comillas en el archivo).

3. Guarda el archivo.

---

## 6. Reiniciar la app

1. En la terminal donde corre el proyecto: **Ctrl+C** para detener.
2. Vuelve a ejecutar: `npm run dev`.
3. Abre la app en el navegador y usa Inventarios, pedidos, etc.; los datos se guardarán en tu nuevo Firestore.

---

## Resumen

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | Firebase Console | Crear proyecto nuevo |
| 2 | Firebase Console | Agregar app web y copiar `firebaseConfig` |
| 3 | Firestore Database | Crear base de datos |
| 4 | Firestore → Reglas | Publicar reglas que permitan read/write |
| 5 | Este proyecto | Pegar config en `.env.local` |
| 6 | Terminal | Reiniciar con `npm run dev` |

Si algo falla, revisa la consola del navegador (F12 → Console) y que los valores en `.env.local` no tengan espacios ni comillas de más.
