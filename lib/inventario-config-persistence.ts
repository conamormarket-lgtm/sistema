/**
 * Persistencia de configuración de inventarios (configInventarioPrendas y configInventarioGenerico).
 * Con Firebase: documento config/inventariosConfig en Firestore.
 * Sin Firebase: localStorage clave inventarioConfig.
 */
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getDb, useFirebase } from "./firebase"

const STORAGE_KEY = "inventarioConfig"
const FIRESTORE_CONFIG_PATH = "config"
const FIRESTORE_CONFIG_DOC = "inventariosConfig"

type ConfigPrendas = { tiposPrenda: string[]; colores: string[]; tallas: string[] }
type ConfigGenerico = Record<string, { nombreItem: string; tipos: string[]; caracteristicas: { nombre: string; valores: string[] }[] }>

function toSerializable(obj: unknown): unknown {
  if (obj == null) return obj
  if (Array.isArray(obj)) return obj.map(toSerializable)
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = toSerializable(v)
    return out
  }
  return obj
}

export async function loadInventarioConfig(mockDatabase: any): Promise<void> {
  if (typeof window === "undefined") return
  try {
    if (useFirebase && getDb()) {
      const ref = doc(getDb()!, FIRESTORE_CONFIG_PATH, FIRESTORE_CONFIG_DOC)
      const snap = await getDoc(ref)
      const data = snap.data()
      if (data?.configInventarioPrendas && typeof mockDatabase.configInventarioPrendas === "object") {
        const p = data.configInventarioPrendas as ConfigPrendas
        if (Array.isArray(p.tiposPrenda)) mockDatabase.configInventarioPrendas.tiposPrenda = p.tiposPrenda
        if (Array.isArray(p.colores)) mockDatabase.configInventarioPrendas.colores = p.colores
        if (Array.isArray(p.tallas)) mockDatabase.configInventarioPrendas.tallas = p.tallas
      }
      if (data?.configInventarioGenerico && typeof data.configInventarioGenerico === "object") {
        mockDatabase.configInventarioGenerico = { ...mockDatabase.configInventarioGenerico, ...(data.configInventarioGenerico as ConfigGenerico) }
      }
      return
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as { configInventarioPrendas?: ConfigPrendas; configInventarioGenerico?: ConfigGenerico }
    if (data.configInventarioPrendas && typeof mockDatabase.configInventarioPrendas === "object") {
      const p = data.configInventarioPrendas
      if (Array.isArray(p.tiposPrenda)) mockDatabase.configInventarioPrendas.tiposPrenda = p.tiposPrenda
      if (Array.isArray(p.colores)) mockDatabase.configInventarioPrendas.colores = p.colores
      if (Array.isArray(p.tallas)) mockDatabase.configInventarioPrendas.tallas = p.tallas
    }
    if (data.configInventarioGenerico && typeof data.configInventarioGenerico === "object") {
      mockDatabase.configInventarioGenerico = { ...mockDatabase.configInventarioGenerico, ...data.configInventarioGenerico }
    }
  } catch (e) {
    console.warn("loadInventarioConfig:", e)
  }
}

export async function saveInventarioConfig(mockDatabase: any): Promise<void> {
  if (typeof window === "undefined") return
  try {
    const payload = {
      configInventarioPrendas: mockDatabase.configInventarioPrendas
        ? {
            tiposPrenda: Array.isArray(mockDatabase.configInventarioPrendas.tiposPrenda) ? mockDatabase.configInventarioPrendas.tiposPrenda : [],
            colores: Array.isArray(mockDatabase.configInventarioPrendas.colores) ? mockDatabase.configInventarioPrendas.colores : [],
            tallas: Array.isArray(mockDatabase.configInventarioPrendas.tallas) ? mockDatabase.configInventarioPrendas.tallas : [],
          }
        : undefined,
      configInventarioGenerico: mockDatabase.configInventarioGenerico && typeof mockDatabase.configInventarioGenerico === "object"
        ? toSerializable(mockDatabase.configInventarioGenerico) as ConfigGenerico
        : undefined,
    }
    if (useFirebase && getDb()) {
      const ref = doc(getDb()!, FIRESTORE_CONFIG_PATH, FIRESTORE_CONFIG_DOC)
      await setDoc(ref, payload, { merge: true })
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn("saveInventarioConfig:", e)
  }
}
