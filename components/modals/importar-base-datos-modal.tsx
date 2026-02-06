import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
    Upload,
    FileSpreadsheet,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Database,
    X,
    Search,
    Download,
} from "lucide-react"
import { Modal } from "../ui/modal"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import {
    agruparCamposPorCategoria,
    mapearEncabezadosACampos,
    parsearArchivoSoloEncabezado,
    obtenerChunkFilasDesdeWorkbook,
    procesarPedidoImportado,
} from "../../lib/business-logic"
import { mockDatabase } from "../../lib/mock-firebase"
import { formatMoneyStrict } from "../../lib/utils"

export function ImportarBaseDatosModal({ isOpen, onClose, onImportComplete }: any) {
    const [file, setFile] = useState<File | null>(null)
    const [data, setData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [mapping, setMapping] = useState<any>({})
    const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([])
    const [step, setStep] = useState(1) // 1: Seleccionar, 2: Mapear, 3: Procesar, 4: Resultado
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [stats, setStats] = useState<any>(null)
    const [importResults, setImportResults] = useState<{ nuevos: number; actualizados: number; stats?: any } | any[]>([])
    const [identificadorCampo, setIdentificadorCampo] = useState("id") // 'id' o 'combinacion'
    const [mappingPage, setMappingPage] = useState(1)
    const [totalRows, setTotalRows] = useState(0)
    const MAPPING_PAGE_SIZE = 25
    const IMPORT_CHUNK_SIZE = 400
    const workbookRef = useRef<{ workbook: any; sheet: any } | null>(null)

    const categoriasCampos = useMemo(
        () => agruparCamposPorCategoria(),
        [step, isOpen]
    )

    useEffect(() => {
        if (!isOpen) workbookRef.current = null
    }, [isOpen])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        workbookRef.current = null
        try {
            const { headers: fileHeaders, sampleRow, totalRows: total, workbook, sheet } = await parsearArchivoSoloEncabezado(selectedFile)
            if (fileHeaders.length === 0) {
                alert("No se detectaron columnas en el archivo.")
                return
            }
            workbookRef.current = { workbook, sheet }
            setHeaders(fileHeaders)
            setData([sampleRow])
            setTotalRows(total)

            const { mapeo, noMapeados } = mapearEncabezadosACampos(fileHeaders)
            setMapping(mapeo)
            setUnmappedHeaders(noMapeados)
            setMappingPage(1)
            setStep(2)
        } catch (error: any) {
            alert("Error al parsear el archivo: " + error.message)
        }
    }

    const handleMappingChange = (header: string, field: string) => {
        if (field === "no-mapear") {
            const newMapping = { ...mapping }
            delete newMapping[header]
            setMapping(newMapping)
            if (!unmappedHeaders.includes(header)) {
                setUnmappedHeaders([...unmappedHeaders, header])
            }
        } else {
            const allFields: any[] = []
            Object.keys(categoriasCampos).forEach((cat: any) => {
                allFields.push(...categoriasCampos[cat].campos)
            })

            const selectedField = allFields.find((f: any) => f.campo === field)
            if (selectedField) {
                setMapping({
                    ...mapping,
                    [header]: {
                        campo: selectedField.campo,
                        tipo: selectedField.tipo,
                        nombre: selectedField.nombre,
                        manual: true,
                    },
                })
                setUnmappedHeaders(unmappedHeaders.filter((h: any) => h !== header))
            }
        }
    }

    const startImport = async () => {
        const wbRef = workbookRef.current
        if (!wbRef?.sheet || headers.length === 0) {
            alert("No hay datos de archivo. Vuelve a seleccionar el archivo.")
            return
        }

        setIsProcessing(true)
        setStep(3)
        setProgress(0)

        let nuevos = 0
        let actualizados = 0
        let montoTotal = 0
        let montoAdelanto = 0
        let montoPendiente = 0
        const totalDataRows = Math.max(0, totalRows - 1)
        let processed = 0

        for (let startRow = 1; startRow < totalRows; startRow += IMPORT_CHUNK_SIZE) {
            const chunk = await obtenerChunkFilasDesdeWorkbook(
                wbRef.sheet,
                headers,
                startRow,
                IMPORT_CHUNK_SIZE,
                totalRows
            )
            for (const row of chunk) {
                const keys = Object.keys(row)
                const totalCols = keys.length || 1
                const emptyCount = keys.filter((k) => {
                    const v = row[k]
                    return v == null || (typeof v === "string" && String(v).trim() === "")
                }).length
                if (emptyCount / totalCols >= 0.8) {
                    processed++
                    if (processed % 10 === 0 || processed === totalDataRows) {
                        setProgress(totalDataRows > 0 ? Math.round((processed / totalDataRows) * 100) : 100)
                    }
                    continue
                }

                let idValor = null
                if (identificadorCampo === "id") {
                    const idHeader = Object.keys(mapping).find((h: any) => mapping[h].campo === "id")
                    idValor = idHeader ? String(row[idHeader]) : null
                }
                try {
                    const { pedido, fueActualizado } = await procesarPedidoImportado(
                        row,
                        mapping,
                        identificadorCampo,
                        idValor
                    )
                    if (fueActualizado) actualizados++
                    else nuevos++
                    montoTotal += Number(pedido.montoTotal) || 0
                    montoAdelanto += Number(pedido.montoAdelanto) || 0
                    const pend = pedido.montoPendiente !== undefined && pedido.montoPendiente !== null
                        ? Number(pedido.montoPendiente)
                        : (Number(pedido.montoTotal) || 0) - (Number(pedido.montoAdelanto) || 0) - (Number(pedido.cobranza?.pago1) || 0) - (Number(pedido.cobranza?.pago2) || 0)
                    montoPendiente += Math.max(0, pend)
                } catch (error: any) {
                    console.error("Error procesando fila:", processed, error)
                }
                processed++
                if (processed % 10 === 0 || processed === totalDataRows) {
                    setProgress(totalDataRows > 0 ? Math.round((processed / totalDataRows) * 100) : 100)
                }
            }
        }

        const statsSummary = {
            monetarios: { montoTotal, montoAdelanto, montoPendiente },
        }
        setStats(statsSummary)
        setImportResults({ nuevos, actualizados, stats: statsSummary })
        setIsProcessing(false)
        setStep(4)
        if (onImportComplete) onImportComplete(undefined)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Base de Datos" size="4xl">
            <div className="space-y-6">
                {/* Pasos */}
                <div className="flex items-center justify-between border-b pb-4">
                    {[
                        { n: 1, t: "Seleccionar" },
                        { n: 2, t: "Mapear Campos" },
                        { n: 3, t: "Procesar" },
                        { n: 4, t: "Resultado" },
                    ].map((s: any) => (
                        <div
                            key={s.n}
                            className={`flex items-center gap-2 ${step === s.n ? "text-blue-600 font-bold" : step > s.n ? "text-green-600" : "text-slate-400"
                                }`}
                        >
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === s.n
                                    ? "border-blue-600 bg-blue-50"
                                    : step > s.n
                                        ? "border-green-600 bg-green-50"
                                        : "border-slate-300"
                                    }`}
                            >
                                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                            </div>
                            <span className="text-sm hidden sm:inline">{s.t}</span>
                            {s.n < 4 && <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Seleccionar Archivo */}
                {step === 1 && (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <div className="bg-white p-4 rounded-full shadow-md mb-4 text-blue-600">
                            <Upload className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Cargar Archivo de Excel o CSV</h3>
                        <p className="text-slate-500 text-center max-w-md mt-2 px-6">
                            Sube tu base de datos de pedidos para importarlos al sistema. Podrás mapear los campos
                            automáticamente.
                        </p>
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileSelect}
                        />
                        <label
                            htmlFor="file-upload"
                            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Seleccionar Archivo
                            <FileSpreadsheet className="w-5 h-5" />
                        </label>
                        <p className="mt-4 text-xs text-slate-400">Archivos admitidos: .xlsx, .xls, .csv</p>
                    </div>
                )}

                {/* Step 2: Mapear Campos */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Archivo detectado: {file?.name}</p>
                                    <p className="text-xs opacity-80">
                                        {Math.max(0, totalRows - 1)} filas y {headers.length} columnas encontradas.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase opacity-60">Identificar por:</span>
                                <select
                                    value={identificadorCampo}
                                    onChange={(e: any) => setIdentificadorCampo(e.target.value)}
                                    className="text-xs font-bold bg-white border border-blue-200 rounded px-2 py-1 outline-none"
                                >
                                    <option value="id">Nº Pedido (ID)</option>
                                    <option value="combinacion">Nombre + Fecha + Monto</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400 uppercase px-4 flex-1">
                                    <span>Columna en Archivo</span>
                                    <span>Campo en Sistema</span>
                                </div>
                                {headers.length > MAPPING_PAGE_SIZE && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="secondary"
                                            className="!py-1 !px-2 text-xs"
                                            onClick={() => setMappingPage((p) => Math.max(1, p - 1))}
                                            disabled={mappingPage <= 1}
                                        >
                                            Anterior
                                        </Button>
                                        <span className="text-xs text-slate-600 whitespace-nowrap">
                                            Columnas {(mappingPage - 1) * MAPPING_PAGE_SIZE + 1}-{Math.min(mappingPage * MAPPING_PAGE_SIZE, headers.length)} de {headers.length}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            className="!py-1 !px-2 text-xs"
                                            onClick={() => setMappingPage((p) => Math.min(Math.ceil(headers.length / MAPPING_PAGE_SIZE), p + 1))}
                                            disabled={mappingPage >= Math.ceil(headers.length / MAPPING_PAGE_SIZE)}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="max-h-[360px] overflow-y-auto pr-2 space-y-3">
                                {headers
                                    .slice((mappingPage - 1) * MAPPING_PAGE_SIZE, mappingPage * MAPPING_PAGE_SIZE)
                                    .map((header: any) => (
                                        <div
                                            key={header}
                                            className={`grid grid-cols-2 gap-4 items-center p-3 rounded-xl border transition-all ${mapping[header]
                                                ? "bg-white border-slate-200"
                                                : "bg-amber-50 border-amber-200 shadow-sm shadow-amber-50"
                                                }`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-slate-700 truncate" title={header}>
                                                    {header}
                                                </span>
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    Ej: {String(data[0]?.[header] || "").substring(0, 30)}
                                                    {(String(data[0]?.[header] || "").length > 30 ? "..." : "") || "vacío"}
                                                </span>
                                            </div>

                                            <div className="relative min-w-0">
                                                <select
                                                    value={mapping[header]?.campo || "no-mapear"}
                                                    onChange={(e: any) => handleMappingChange(header, e.target.value)}
                                                    className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border outline-none focus:ring-2 transition-all ${mapping[header]
                                                        ? "bg-slate-50 border-slate-200 focus:ring-blue-500"
                                                        : "bg-white border-amber-300 focus:ring-amber-500"
                                                        }`}
                                                >
                                                    <option value="no-mapear">-- No importar esta columna --</option>
                                                    {Object.keys(categoriasCampos).map((catId: any) => (
                                                        <optgroup key={catId} label={categoriasCampos[catId].nombre}>
                                                            {categoriasCampos[catId].campos.map((campo: any) => (
                                                                <option key={campo.campo} value={campo.campo}>
                                                                    {campo.nombre}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    {mapping[header] ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="secondary" onClick={() => setStep(1)}>
                                Atrás
                            </Button>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">
                                    {Object.keys(mapping).length} campos mapeados de {headers.length}
                                </span>
                                <Button
                                    variant="primary"
                                    onClick={startImport}
                                    disabled={Object.keys(mapping).length === 0}
                                    iconRight={<ArrowRight className="w-4 h-4" />}
                                >
                                    Confirmar y Procesar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Procesando */}
                {step === 3 && (
                    <div className="py-12 flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                            <div
                                className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
                                style={{ animationDuration: "1.5s" }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800">Procesando Base de Datos</h3>
                        <p className="text-slate-500 mt-2">Por favor no cierres esta ventana...</p>

                        <div className="w-full max-w-md mt-8">
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 uppercase">
                                <span>Analizando filas</span>
                                <span>
                                    {Math.round((progress / 100) * Math.max(0, totalRows - 1))} / {Math.max(0, totalRows - 1)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Resultado */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="grow">
                                <h3 className="text-xl font-bold text-green-800">¡Importación Exitosa!</h3>
                                <p className="text-green-700 opacity-80">
                                    Se han procesado correctamente {Math.max(0, totalRows - 1)} registros del archivo.
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex gap-2">
                                <div className="bg-white p-2 px-4 rounded-xl shadow-sm text-center border border-green-200">
                                    <div className="text-2xl font-black text-green-600">
                                        {Array.isArray(importResults) ? importResults.filter((r: any) => !r._fueActualizado).length : (importResults as any).nuevos ?? 0}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Nuevos</div>
                                </div>
                                <div className="bg-white p-2 px-4 rounded-xl shadow-sm text-center border border-blue-200">
                                    <div className="text-2xl font-black text-blue-600">
                                        {Array.isArray(importResults) ? importResults.filter((r: any) => r._fueActualizado).length : (importResults as any).actualizados ?? 0}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Actualizados</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Monto</p>
                                <p className="text-lg font-bold text-slate-800">
                                    S/ {formatMoneyStrict(stats?.monetarios?.montoTotal ?? 0)}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Monto Adelanto</p>
                                <p className="text-lg font-bold text-slate-800">
                                    S/ {formatMoneyStrict(stats?.monetarios?.montoAdelanto ?? 0)}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Monto Pendiente</p>
                                <p className="text-lg font-bold text-slate-800">
                                    S/ {formatMoneyStrict(stats?.monetarios?.montoPendiente ?? 0)}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Eficiencia</p>
                                <p className="text-lg font-bold text-slate-800">100%</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button variant="secondary" onClick={onClose}>
                                Cerrar Ventana
                            </Button>
                            <Button
                                variant="primary"
                                onClick={onClose}
                                iconLeft={<Download className="w-4 h-4" />}
                            >
                                Ver Pedidos Importados
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
