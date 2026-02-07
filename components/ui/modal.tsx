
import React from "react"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Modal({ isOpen, onClose, title, children, size = "md", zIndex = 50 }: any) {
    if (!isOpen) return null

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        full: "max-w-full h-full",
    }

    return (
        <div
            className="fixed inset-0 overflow-y-auto bg-slate-200/90 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: isOpen ? zIndex : -1 }}
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl border border-slate-200 transform transition-all ${(sizes as any)[size] || sizes.md} w-full ${size === "full" ? "h-full" : "max-h-[90vh]"} flex flex-col`}
                onClick={(e: any) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                    <h3 className="text-lg font-bold leading-6 text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-blue-600 focus:outline-none transition-colors rounded-lg p-1 hover:bg-slate-100">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow bg-white rounded-b-2xl">{children}</div>
            </div>
        </div>
    )
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
}: any) {
    if (!isOpen) return null
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" zIndex={60}>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <Button variant="ghost" onClick={onClose}>
                    {cancelText}
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    )
}
