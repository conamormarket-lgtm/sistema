/**
 * Capa de datos del módulo Inventario (portado de conamormarket-lgtm/inventory).
 * Usa mockDatabase en memoria; misma API que el DataManager del repo original.
 */

import { mockDatabase } from "./mock-firebase";
import {
    initialTiposDePrendaInventario,
    initialColoresInventarioConHex,
    initialTallasInventario,
} from "./constants";

export type InventoryItem = {
    type: string;
    color: string;
    size: string;
    quantity: number;
    id: string;
};

export type HistoryLog = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    quantity: number;
    metadata: {
        type: string;
        color: string;
        size: string;
        quantity: number;
        originalActionType: string;
    };
};

export type InventoryMetadata = {
    garments: string[];
    colors: { name: string; hex: string }[];
    sizes: string[];
};

function ensureMetadata(): InventoryMetadata {
    if (!mockDatabase.inventoryMetadata) {
        mockDatabase.inventoryMetadata = {
            garments: [...initialTiposDePrendaInventario],
            colors: [...initialColoresInventarioConHex],
            sizes: [...initialTallasInventario],
        };
    }
    return mockDatabase.inventoryMetadata;
}

function itemId(type: string, color: string, size: string): string {
    return `${type}_${color}_${size}`.replace(/[\s/]+/g, "-").toLowerCase();
}

export const InventarioData = {
    getInventory(): InventoryItem[] {
        return mockDatabase.inventoryStats?.items ?? [];
    },

    getHistory(): HistoryLog[] {
        return mockDatabase.inventoryHistory ?? [];
    },

    getMetadata(): InventoryMetadata {
        return ensureMetadata();
    },

    addMovement(
        type: "entry" | "exit",
        itemDetails: { type: string; color: string; size: string },
        quantity: number,
        user: { name?: string; username?: string }
    ): { success: true; newStock: number } | { success: false; error: string } {
        const items = mockDatabase.inventoryStats?.items ?? [];
        const id = itemId(itemDetails.type, itemDetails.color, itemDetails.size);
        const index = items.findIndex(
            (i) =>
                i.type === itemDetails.type &&
                i.color.toLowerCase() === itemDetails.color.toLowerCase() &&
                i.size.toLowerCase() === itemDetails.size.toLowerCase()
        );

        if (type === "exit") {
            if (index === -1) return { success: false, error: "Item no encontrado en inventario." };
            if (items[index].quantity < quantity)
                return {
                    success: false,
                    error: `Stock insuficiente. Disponible: ${items[index].quantity}`,
                };
            items[index].quantity -= quantity;
            const newStock = items[index].quantity;
            mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
            const log: HistoryLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                timestamp: new Date().toISOString(),
                user: user.name || user.username || "Usuario",
                action: "Salida",
                details: `${itemDetails.type} - ${itemDetails.color} - Talla ${itemDetails.size} (Cant: ${quantity})`,
                quantity,
                metadata: {
                    type: itemDetails.type,
                    color: itemDetails.color,
                    size: itemDetails.size,
                    quantity,
                    originalActionType: "exit",
                },
            };
            mockDatabase.inventoryHistory.unshift(log);
            return { success: true, newStock };
        }

        // entry
        if (index !== -1) {
            items[index].quantity += quantity;
            const newStock = items[index].quantity;
            mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
            const log: HistoryLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                timestamp: new Date().toISOString(),
                user: user.name || user.username || "Usuario",
                action: "Entrada",
                details: `${itemDetails.type} - ${itemDetails.color} - Talla ${itemDetails.size} (Cant: ${quantity})`,
                quantity,
                metadata: {
                    type: itemDetails.type,
                    color: itemDetails.color,
                    size: itemDetails.size,
                    quantity,
                    originalActionType: "entry",
                },
            };
            mockDatabase.inventoryHistory.unshift(log);
            return { success: true, newStock };
        }

        items.push({
            type: itemDetails.type,
            color: itemDetails.color,
            size: itemDetails.size,
            quantity,
            id,
        });
        mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
        const log: HistoryLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
            user: user.name || user.username || "Usuario",
            action: "Entrada",
            details: `${itemDetails.type} - ${itemDetails.color} - Talla ${itemDetails.size} (Cant: ${quantity})`,
            quantity,
            metadata: {
                type: itemDetails.type,
                color: itemDetails.color,
                size: itemDetails.size,
                quantity,
                originalActionType: "entry",
            },
        };
        mockDatabase.inventoryHistory.unshift(log);
        return { success: true, newStock: quantity };
    },

    undoLastAction(user: { name?: string; username?: string }): { success: true; newStock: number } | { success: false; error: string } {
        const history = mockDatabase.inventoryHistory ?? [];
        const currentUser = user.name || user.username || "";
        const log = history.find((l) => l.user === currentUser);
        if (!log || !log.metadata)
            return { success: false, error: "No se encontró acción reciente para deshacer." };

        const { type, color, size, quantity, originalActionType } = log.metadata;
        const items = mockDatabase.inventoryStats?.items ?? [];
        const index = items.findIndex(
            (i) =>
                i.type === type &&
                i.color.toLowerCase() === color.toLowerCase() &&
                i.size.toLowerCase() === size.toLowerCase()
        );

        if (originalActionType === "entry") {
            if (index === -1) return { success: false, error: "Item no encontrado." };
            if (items[index].quantity < quantity)
                return { success: false, error: "Stock insuficiente para revertir." };
            items[index].quantity -= quantity;
            const newStock = items[index].quantity;
            if (items[index].quantity === 0) items.splice(index, 1);
            mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
            const idx = mockDatabase.inventoryHistory.findIndex((l) => l.id === log.id);
            if (idx !== -1) mockDatabase.inventoryHistory.splice(idx, 1);
            return { success: true, newStock };
        }

        // exit -> revert: add back
        if (index !== -1) {
            items[index].quantity += quantity;
        } else {
            items.push({
                type,
                color,
                size,
                quantity,
                id: itemId(type, color, size),
            });
        }
        mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
        const idx = mockDatabase.inventoryHistory.findIndex((l) => l.id === log.id);
        if (idx !== -1) mockDatabase.inventoryHistory.splice(idx, 1);
        const item = items.find(
            (i) =>
                i.type === type &&
                i.color.toLowerCase() === color.toLowerCase() &&
                i.size.toLowerCase() === size.toLowerCase()
        );
        return { success: true, newStock: item?.quantity ?? quantity };
    },

    getHistoryByDateRange(startDate: Date, endDate: Date): HistoryLog[] {
        const history = mockDatabase.inventoryHistory ?? [];
        return history.filter((log) => {
            const t = new Date(log.timestamp).getTime();
            return t >= startDate.getTime() && t <= endDate.getTime();
        });
    },

    deleteLogsByDateRange(startDate: Date, endDate: Date): { success: true; count: number } | { success: false; error: string } {
        const history = mockDatabase.inventoryHistory ?? [];
        const toRemove = history.filter((log) => {
            const t = new Date(log.timestamp).getTime();
            return t >= startDate.getTime() && t <= endDate.getTime();
        });
        toRemove.forEach((log) => {
            const idx = mockDatabase.inventoryHistory.findIndex((l) => l.id === log.id);
            if (idx !== -1) mockDatabase.inventoryHistory.splice(idx, 1);
        });
        return { success: true, count: toRemove.length };
    },

    resetAllStock(): { success: true; count: number } | { success: false; error: string } {
        const items = mockDatabase.inventoryStats?.items ?? [];
        const count = items.length;
        mockDatabase.inventoryStats.items = [];
        mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
        return { success: true, count };
    },

    /**
     * Formato idéntico al proyecto original (conamormarket-lgtm/inventory):
     * Cabecera: Fecha,Hora,Tipo,Usuario,Detalle,Cantidad
     * Fecha/Hora con toLocaleDateString/toLocaleTimeString (es) para compatibilidad con parseHistoryCSV.
     */
    exportHistoryToCSV(logs: HistoryLog[]): string {
        const header = "Fecha,Hora,Tipo,Usuario,Detalle,Cantidad\n"
        const rows = logs.map((log) => {
            const d = new Date(log.timestamp)
            const date = d.toLocaleDateString("es")
            const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            const detail = `"${(log.details || "").replace(/"/g, '""')}"`
            let qty = log.quantity
            if (qty == null && log.metadata?.quantity != null) qty = log.metadata.quantity
            if (qty == null) {
                const match = (log.details || "").match(/\(Cant:\s*(\d+)\)/)
                if (match?.[1]) qty = parseInt(match[1], 10)
            }
            const q = qty ?? 1
            return `${date},${time},${log.action},${log.user},${detail},${q}\n`
        })
        return header + rows.join("")
    },

    /**
     * Parsea CSV de historial en el mismo formato que el proyecto original (parseCSVtoLogs).
     * Cabecera: Fecha,Hora,Tipo,Usuario,Detalle,Cantidad. Fecha DD/MM/YYYY, Hora HH:MM:SS.
     */
    parseHistoryCSV(csvText: string): Array<{ timestamp: string; user: string; action: string; details: string; quantity: number }> {
        const lines = csvText.split("\n").filter((l) => l.trim().length > 0)
        const logs: Array<{ timestamp: string; user: string; action: string; details: string; quantity: number }> = []
        const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(splitRegex)
            if (cols.length < 5) continue
            const dateStr = cols[0].trim() + " " + (cols[1] || "").trim()
            let timestamp = new Date().toISOString()
            try {
                if (dateStr.includes("/")) {
                    const [dPart, tPart] = dateStr.split(" ")
                    const [day, month, year] = (dPart || "").split("/").map(Number)
                    const timeParts = (tPart || "0:0:0").split(":").map(Number)
                    const [hr = 0, min = 0, sec = 0] = timeParts
                    timestamp = new Date(year, month - 1, day, hr, min, sec).toISOString()
                } else {
                    timestamp = new Date(dateStr).toISOString()
                }
            } catch {
                // keep default
            }
            const action = (cols[2] || "").trim()
            const user = (cols[3] || "").trim()
            const details = (cols[4] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()
            const qty = parseInt(cols[5], 10) || 1
            logs.push({ timestamp, user, action, details, quantity: qty })
        }
        return logs
    },

    /**
     * Importa registros de historial (mismo formato que exportHistoryToCSV/parseHistoryCSV del proyecto original).
     */
    importHistoryLogs(
        logs: Array<{ timestamp: string; user: string; action: string; details: string; quantity: number }>
    ): { success: true; count: number } | { success: false; error: string } {
        if (!mockDatabase.inventoryHistory) mockDatabase.inventoryHistory = []
        const meta = (details: string, action: string, quantity: number) => {
            const m = details.match(/(.+?)\s*-\s*(.+?)\s*-\s*Talla\s*(.+?)\s*\(Cant:/)
            if (m) return { type: m[1].trim(), color: m[2].trim(), size: m[3].trim(), quantity, originalActionType: action === "Entrada" ? "entry" : "exit" as const }
            return { type: "", color: "", size: "", quantity, originalActionType: (action === "Entrada" ? "entry" : "exit") as "entry" | "exit" }
        }
        for (const log of logs) {
            const metadata = meta(log.details, log.action, log.quantity)
            const entry: HistoryLog = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                timestamp: log.timestamp,
                user: log.user,
                action: log.action,
                details: log.details,
                quantity: log.quantity,
                metadata: { ...metadata, type: metadata.type, color: metadata.color, size: metadata.size, quantity: metadata.quantity, originalActionType: metadata.originalActionType },
            }
            mockDatabase.inventoryHistory.push(entry)
        }
        return { success: true, count: logs.length }
    },

    /**
     * Stock masivo: mismo formato que el proyecto original. Cabecera TIPO,COLOR,TALLA,CANTIDAD (COLOR opcional → Unico).
     */
    importStockFromCSV(csvText: string): { success: true; count: number; totalUnits: number } | { success: false; error: string } {
        const lines = csvText.split("\n");
        const headerRow = lines.find((l) => l.toUpperCase().includes("TIPO") && l.toUpperCase().includes("CANTIDAD"));
        if (!headerRow) return { success: false, error: "Formato no reconocido." };

        const headers = headerRow.split(",").map((h) => h.trim().toUpperCase());
        const idxType = headers.indexOf("TIPO");
        const idxColor = headers.indexOf("COLOR");
        const idxSize = headers.indexOf("TALLA");
        const idxQty = headers.indexOf("CANTIDAD");
        if (idxType === -1 || idxSize === -1 || idxQty === -1) return { success: false, error: "Faltan columnas TIPO, TALLA o CANTIDAD." };

        const items = [...(mockDatabase.inventoryStats?.items ?? [])];
        const itemMap = new Map<string, InventoryItem>();
        items.forEach((item) => {
            const key = `${item.type}_${item.color}_${item.size}`.toLowerCase();
            itemMap.set(key, { ...item });
        });

        let count = 0;
        let totalUnits = 0;
        for (const line of lines) {
            if (!line || line === headerRow || line.trim() === "") continue;
            const cols = line.split(",");
            if (cols.length < 3) continue;
            const type = cols[idxType]?.trim();
            const color = idxColor !== -1 ? cols[idxColor]?.trim() : "Unico";
            const size = cols[idxSize]?.trim();
            const qtyStr = cols[idxQty]?.trim();
            if (!type || !size || !qtyStr) continue;
            const quantity = parseInt(qtyStr, 10);
            if (Number.isNaN(quantity)) continue;

            const key = `${type}_${color}_${size}`.toLowerCase();
            const current = itemMap.get(key);
            if (current) {
                current.quantity += quantity;
            } else {
                const newItem: InventoryItem = {
                    type,
                    color,
                    size,
                    quantity,
                    id: key.replace(/_/g, "-"),
                };
                itemMap.set(key, newItem);
            }
            count++;
            totalUnits += quantity;
        }

        mockDatabase.inventoryStats.items = Array.from(itemMap.values());
        mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
        return { success: true, count, totalUnits };
    },

    /**
     * Optimización local: revisa y normaliza la estructura del inventario (id, type, color, size, quantity).
     * Equivalente conceptual a "RESCATAR DATOS (MIGRAR)" del proyecto original.
     */
    normalizeInventoryStats(): { success: true; count: number } | { success: false; error: string } {
        const items = mockDatabase.inventoryStats?.items ?? [];
        const seen = new Map<string, InventoryItem>();
        for (const it of items) {
            const type = (it.type ?? "").trim();
            const color = (it.color ?? "").trim() || "Unico";
            const size = (it.size ?? "").trim();
            const quantity = typeof it.quantity === "number" ? it.quantity : parseInt(String(it.quantity), 10) || 0;
            const key = `${type}_${color}_${size}`.toLowerCase();
            const existing = seen.get(key);
            if (existing) {
                existing.quantity += quantity;
            } else {
                seen.set(key, {
                    type,
                    color,
                    size,
                    quantity,
                    id: (it.id ?? key.replace(/_/g, "-")).trim() || key.replace(/_/g, "-"),
                });
            }
        }
        mockDatabase.inventoryStats = mockDatabase.inventoryStats ?? { items: [], lastUpdated: "" };
        mockDatabase.inventoryStats.items = Array.from(seen.values());
        mockDatabase.inventoryStats.lastUpdated = new Date().toISOString();
        return { success: true, count: seen.size };
    },

    addGarmentType(name: string): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        if (meta.garments.some((g) => g.toLowerCase() === name.toLowerCase()))
            return { success: false, error: "La prenda ya existe." };
        meta.garments.push(name);
        meta.garments.sort((a, b) => a.localeCompare(b));
        return { success: true };
    },

    removeGarmentType(name: string): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        const idx = meta.garments.findIndex((g) => g.toLowerCase() === name.toLowerCase());
        if (idx === -1) return { success: false, error: "Prenda no encontrada." };
        meta.garments.splice(idx, 1);
        return { success: true };
    },

    addColor(name: string, hex = "#000000"): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        if (meta.colors.some((c) => c.name.toLowerCase() === name.toLowerCase()))
            return { success: false, error: "El color ya existe." };
        meta.colors.push({ name, hex });
        meta.colors.sort((a, b) => a.name.localeCompare(b.name));
        return { success: true };
    },

    removeColor(colorName: string): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        const idx = meta.colors.findIndex((c) => c.name.toLowerCase() === colorName.toLowerCase());
        if (idx === -1) return { success: false, error: "Color no encontrado." };
        meta.colors.splice(idx, 1);
        return { success: true };
    },

    addSize(name: string): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        if (meta.sizes.some((s) => s.toLowerCase() === name.toLowerCase()))
            return { success: false, error: "La talla ya existe." };
        meta.sizes.push(name);
        meta.sizes.sort((a, b) => a.localeCompare(b));
        return { success: true };
    },

    removeSize(name: string): { success: true } | { success: false; error: string } {
        const meta = ensureMetadata();
        const idx = meta.sizes.findIndex((s) => s.toLowerCase() === name.toLowerCase());
        if (idx === -1) return { success: false, error: "Talla no encontrada." };
        meta.sizes.splice(idx, 1);
        return { success: true };
    },
};
