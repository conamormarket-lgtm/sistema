
import React from "react"

export function Input({
    label,
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    required,
    icon,
    error,
    className = "",
    ...props
}: any) {
    const isTextarea = type === "textarea"
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9)

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative rounded-md shadow-sm">
                {icon && !isTextarea && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">{icon}</div>}
                {isTextarea ? (
                    <textarea
                        id={inputId}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-slate-300"} rounded-lg focus:ring-slate-500 focus:border-slate-500 sm:text-sm`}
                        {...props}
                    />
                ) : (
                    <input
                        id={inputId}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        className={`block w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2 border ${error ? "border-red-500" : "border-slate-300"} rounded-lg focus:ring-slate-500 focus:border-slate-500 sm:text-sm`}
                        {...props}
                    />
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

export function Select({
    label,
    id,
    value,
    onChange,
    onValueChange,
    children,
    options,
    placeholder,
    required,
    error,
    className = "",
    ...props
}: any) {
    const selectId = id || props.name || Math.random().toString(36).substr(2, 9)

    const handleNativeChange = (e: any) => {
        if (onChange) onChange(e)
        if (onValueChange) onValueChange(e.target.value)
    }

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                id={selectId}
                value={value}
                onChange={handleNativeChange}
                required={required}
                className={`block w-full pl-3 pr-10 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {children || (options && options.map((opt: any) => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                    </option>
                )))}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}
