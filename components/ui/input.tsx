
import React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
  rows?: number
}

export function Input({ label, id, type = "text", value, onChange, placeholder, required, icon, error, className, rows, ...props }: InputProps) {
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
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: (string | { value: string; label: string })[]
  error?: string
  placeholder?: string
}

export function Select({ label, id, value, onChange, options, placeholder, required, error, className, ...props }: SelectProps) {
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
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full pl-3 pr-10 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt: any) => {
          const optValue = typeof opt === "string" ? opt : opt.value
          const optLabel = typeof opt === "string" ? opt : opt.label
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
