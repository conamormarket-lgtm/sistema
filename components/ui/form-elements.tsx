import React from "react"

export function Input({ label, id, type = "text", value, onChange, placeholder, required, icon, error, className, rows, ...props }: any) {
    const isTextarea = type === "textarea"
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative rounded-md shadow-sm">
                {icon && !isTextarea && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">{icon}</div>}
                {isTextarea ? (
                    <textarea
                        id={id}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        rows={rows || 3}
                        className={`block w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2 border ${error ? "border-red-500" : "border-slate-300"} rounded-lg focus:ring-slate-500 focus:border-slate-500 sm:text-sm`}
                        {...props}
                    />
                ) : (
                    <input
                        type={type}
                        id={id}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        className={`block w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2 border ${error ? "border-red-500" : "border-slate-300"} rounded-lg focus:ring-slate-500 focus:border-slate-500 sm:text-sm`}
                        {...props}
                    />
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{typeof error === "object" ? (error?.message ?? "") : String(error)}</p>}
        </div>
    )
}

export function Select({ label, id, value, onChange, options, placeholder, required, error, className, ...props }: any) {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                id={id}
                value={typeof value === "object" && value !== null ? (value?.value ?? value?.label ?? "") : (value ?? "")}
                onChange={onChange}
                required={required}
                className={`block w-full pl-3 pr-10 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt: any, idx: number) => {
                    const optVal = opt?.value ?? opt?.label ?? opt
                    const optLabel = opt?.label ?? opt?.value ?? opt
                    const keyVal = typeof optVal === "object" ? `opt-${idx}` : String(optVal ?? idx)
                    const displayLabel = typeof optLabel === "object" ? "" : String(optLabel ?? "")
                    const displayValue = typeof optVal === "object" ? "" : String(optVal ?? "")
                    return (
                        <option key={keyVal} value={displayValue}>
                            {displayLabel}
                        </option>
                    )
                })}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{typeof error === "object" ? (error?.message ?? "") : String(error)}</p>}
        </div>
    )
}
