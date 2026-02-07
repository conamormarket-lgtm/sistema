/**
 * Adaptador de Firestore que expone la misma API que el mock (collection/doc add/update/delete/onSnapshot)
 * y mantiene mockDatabase sincronizado para código que lee directamente de mockDatabase.
 */
import {
  collection as fsCollection,
  doc as fsDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot as fsOnSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore"

const COLLECTION_KEYS = [
  "pedidos",
  "flujos",
  "etapas",
  "inventarios",
  "users",
  "userProfiles",
  "clientes",
  "productos",
  "inventarioPrendas",
  "inventarioProductos",
  "categoriasProductos",
  "movimientosInventarioGlobal",
  "leads",
] as const

function pathToKey(path: string): string | null {
  for (const k of COLLECTION_KEYS) {
    if (path.includes(k)) return k
  }
  return null
}

function serializeData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      out[key] = (value as Timestamp).toDate()
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = serializeData(value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }
  return out
}

function createMockSnapshot(docs: { id: string; data: Record<string, unknown> }[]) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
    forEach: (fn: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
      docs.forEach((d) => fn({ id: d.id, data: () => d.data }))
    },
  }
}

export function createFirestoreAdapter(db: Firestore, mockDatabase: any) {
  const listeners: Map<string, Unsubscribe> = new Map()

  function ensureCollectionInMock(key: string) {
    if (!Array.isArray(mockDatabase[key])) mockDatabase[key] = []
  }

  return {
    collection: (path: string) => {
      const key = pathToKey(path)
      if (!key) ensureCollectionInMock(path)

      return {
        add: async (data: any) => {
          let id: string
          if (path.includes("pedidos") && (data.id == null || String(data.id).trim() === "")) {
            const ref = fsDoc(db, "counters", "pedidoCodigoCounter")
            const newData = await runTransaction(db, async (tx) => {
              const snap = await tx.get(ref)
              const last = (snap.data()?.lastCodeNumber as number) ?? 0
              const next = last + 1
              tx.set(ref, { lastCodeNumber: next })
              const numeroPedido = String(next).padStart(6, "0")
              const newItem = {
                ...data,
                id: numeroPedido,
                numeroPedido,
                createdAt: new Date(),
              }
              tx.set(fsDoc(db, "pedidos", numeroPedido), { ...newItem, createdAt: serverTimestamp() })
              return { id: numeroPedido, newItem }
            })
            id = newData.id
            ensureCollectionInMock("pedidos")
            mockDatabase.pedidos.push(newData.newItem)
            return { id }
          }

          const colRef = fsCollection(db, path)
          const payload = { ...data }
          if (!payload.createdAt) payload.createdAt = serverTimestamp()
          if (path.includes("flujos") && data.id) {
            id = data.id
            await setDoc(fsDoc(db, path, id), { ...payload, id })
          } else if (path.includes("etapas") && data.id) {
            id = data.id
            await setDoc(fsDoc(db, path, id), { ...payload, id })
          } else if (path.includes("inventarios") && data.id) {
            id = data.id
            await setDoc(fsDoc(db, path, id), { ...payload, id })
          } else {
            const ref = await addDoc(colRef, payload)
            id = ref.id
          }

          if (key) {
            ensureCollectionInMock(key)
            const item = { ...data, id, createdAt: data.createdAt ?? new Date() }
            mockDatabase[key].push(item)
          }
          return { id }
        },
        onSnapshot: (callback: (snapshot: any) => void) => {
          const colRef = fsCollection(db, path)
          const unsub = fsOnSnapshot(colRef, (snapshot) => {
            const docs = snapshot.docs.map((d) => ({
              id: d.id,
              data: serializeData(d.data() as Record<string, unknown>),
            }))
            const fullDocs = docs.map((d) => ({ ...d.data, id: d.id }))
            if (key) {
              mockDatabase[key] = fullDocs
            }
            callback(createMockSnapshot(docs))
          })
          const listenerKey = path
          if (listeners.has(listenerKey)) listeners.get(listenerKey)!()
          listeners.set(listenerKey, unsub)
          try {
            getDocs(colRef).then((snap) => {
              const docs = snap.docs.map((d) => ({
                id: d.id,
                data: serializeData(d.data() as Record<string, unknown>),
              }))
              const fullDocs = docs.map((d) => ({ ...d.data, id: d.id }))
              if (key) mockDatabase[key] = fullDocs
              callback(createMockSnapshot(docs))
            })
          } catch (e) {
            console.error("firestore-adapter onSnapshot initial load:", e)
          }
          return () => {
            unsub()
            listeners.delete(listenerKey)
          }
        },
      }
    },
    doc: (path: string, id: string) => {
      const key = pathToKey(path)
      const docRef = fsDoc(db, path, id)

      return {
        set: async (data: any) => {
          const payload = { ...data, id, updatedAt: new Date() }
          await setDoc(docRef, { ...payload, updatedAt: serverTimestamp() })
          if (key) {
            ensureCollectionInMock(key)
            const idx = (mockDatabase[key] as any[]).findIndex((i: any) => i.id === id)
            const item = { id, ...data, updatedAt: new Date() }
            if (idx >= 0) (mockDatabase[key] as any[])[idx] = item
            else (mockDatabase[key] as any[]).push(item)
          }
        },
        update: async (data: any) => {
          const payload = { ...data, updatedAt: serverTimestamp() }
          await updateDoc(docRef, payload)
          if (key) {
            ensureCollectionInMock(key)
            const col = mockDatabase[key] as any[]
            const isPedidos = key === "pedidos"
            const idx = isPedidos
              ? col.findIndex((i: any) => String(i?.id ?? i?.numeroPedido ?? "") === String(id))
              : col.findIndex((i: any) => i?.id === id)
            if (idx >= 0) {
              const current = col[idx]
              const updated = { ...current, ...data, updatedAt: new Date() }
              if (data.costoUnitario !== undefined) updated.costoUnitario = data.costoUnitario
              col[idx] = updated
            }
          }
        },
        delete: async () => {
          if (path.includes("users") && id === "user-admin-123") return
          await deleteDoc(docRef)
          if (key) {
            const col = mockDatabase[key] as any[]
            if (!Array.isArray(col)) return
            const isPedidos = key === "pedidos"
            const pred = isPedidos
              ? (item: any) => String(item?.id ?? item?.numeroPedido ?? "") !== String(id)
              : (item: any) => item?.id !== id
            mockDatabase[key] = col.filter(pred)
          }
        },
        get: async () => {
          const snap = await getDoc(docRef)
          const d = snap.data()
          const item = d ? { id: snap.id, ...serializeData(d as Record<string, unknown>) } : null
          return {
            exists: () => snap.exists(),
            data: () => item,
          }
        },
      }
    },
  }
}

// Re-exportar para que el mock pueda usar serverTimestamp real cuando quiera
export { serverTimestamp }
