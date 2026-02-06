import React, { useState, useEffect, useRef } from "react"
import { X, Upload } from "lucide-react"

export function ImageUpload({ label, id, onFileChange, currentFile, required, error, accept = "image/*", maxSizeMB = 5 }: any) {
    const [preview, setPreview] = useState<any>(null)
    const inputRef = useRef<any>(null)

    useEffect(() => {
        if (currentFile) {
            if (currentFile instanceof File) {
                const reader = new FileReader()
                reader.onloadend = () => setPreview(reader.result)
                reader.readAsDataURL(currentFile)
            } else if (typeof currentFile === "string") {
                setPreview(currentFile)
            }
        } else {
            setPreview(null)
        }
    }, [currentFile])

    const handleFileChange = (event: any) => {
        const file = event.target.files[0]
        if (file) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`El archivo es muy grande. Máximo ${maxSizeMB}MB`)
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result)
            reader.readAsDataURL(file)
            onFileChange(file)
        } else {
            setPreview(null)
            onFileChange(null)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onFileChange(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="space-y-2">
                {preview ? (
                    <div className="relative inline-block">
                        <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-slate-200" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600">Haz clic para subir imagen</span>
                        <span className="text-xs text-slate-400 mt-1">Máx. {maxSizeMB}MB</span>
                    </button>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    id={id}
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

export function MultipleImageUpload({ label, onFilesChange, currentFiles = [], maxFiles = 5, accept = "image/*" }: any) {
    const inputRef = useRef<any>(null)
    const [previews, setPreviews] = useState<any[]>([])

    useEffect(() => {
        // Generar previews iniciales
        const generatePreviews = async () => {
            const results = await Promise.all(
                currentFiles.map((file: any) => {
                    if (file instanceof File) {
                        return new Promise((resolve) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(reader.result)
                            reader.readAsDataURL(file)
                        })
                    }
                    return Promise.resolve(file)
                })
            )
            setPreviews(results)
        }
        generatePreviews()
    }, [currentFiles])

    const handleFileChange = (event: any) => {
        const files = Array.from(event.target.files)
        if (currentFiles.length + files.length > maxFiles) {
            alert(`Solo puedes subir hasta ${maxFiles} imágenes`)
            return
        }
        onFilesChange([...currentFiles, ...files])
        if (inputRef.current) inputRef.current.value = ""
    }

    // Nota: El componente original no tenía función de borrado en UI para MultipleImageUpload, 
    // pero si quisiéramos agregarla sería aquí. Por ahora mantengo la paridad.
    // Voy a agregar una vista simple de los previews.

    return (
        <div className="mb-4">
            {label && <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
                {previews.map((src: any, index: any) => (
                    <div key={index} className="relative aspect-square">
                        <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                        {/* Botón de eliminar podría ir aquí si se implementa lógica de borrado */}
                    </div>
                ))}
                {currentFiles.length < maxFiles && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs text-slate-500 mt-1">Añadir</span>
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    )
}
