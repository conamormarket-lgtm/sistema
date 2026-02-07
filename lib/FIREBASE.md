# Conexión a Firebase

La app puede usar **datos en memoria** (por defecto) o **Firestore** real.

## Activar Firestore

1. Crea `.env.local` en la raíz del proyecto.
2. Añade:
   ```
   NEXT_PUBLIC_USE_FIREBASE=true
   ```
3. Opcional: si quieres otro proyecto que no sea el de desarrollo, define las variables de Firebase (ver `.env.example`). Si no las defines, se usan las del proyecto `base-de-datos-30caf`.

## Colecciones que se sincronizan con Firestore

Cuando `NEXT_PUBLIC_USE_FIREBASE=true`, estas colecciones se leen y escriben en Firestore y se mantienen sincronizadas con el estado en memoria:

- `pedidos`
- `flujos`
- `etapas`
- `inventarios`
- `users`
- `userProfiles`
- `clientes`
- `productos`
- `inventarioPrendas`
- `inventarioProductos`
- `categoriasProductos`
- `movimientosInventarioGlobal`
- `leads`

Para pedidos nuevos se usa un contador en Firestore: documento `counters/pedidoCodigoCounter` con campo `lastCodeNumber`.

## Sin Firebase

Si no defines `NEXT_PUBLIC_USE_FIREBASE=true`, la app sigue usando solo el mock en memoria; no hace falta tener proyecto en Firebase para desarrollar.
