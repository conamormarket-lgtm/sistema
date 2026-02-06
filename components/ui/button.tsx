
import React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success" | "successSoft" | "dangerSoft"
  size?: "sm" | "md" | "lg" | "icon" | "default"
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled,
  className = "",
  ...props
}, ref) => {
  const baseStyle =
    "inline-flex items-center justify-center border border-transparent rounded-lg shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200",
    secondary: "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 focus:ring-blue-500 border-slate-300 shadow-sm hover:shadow",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl",
    ghost: "bg-transparent hover:bg-blue-50 text-slate-700 hover:text-blue-700 focus:ring-blue-500 transition-colors",
    outline: "border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500 bg-white shadow-sm hover:shadow",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white focus:ring-emerald-500 shadow-lg hover:shadow-xl",
    successSoft: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-500 border-emerald-200 shadow-sm",
    dangerSoft: "bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-500 border-red-200 shadow-sm",
  }
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-9 w-9 p-0",
    default: "px-4 py-2 text-sm",
  }
  const disabledStyle = "opacity-50 cursor-not-allowed"

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? disabledStyle : ""} ${className}`}
      {...props}
    >
      {iconLeft && <span className="mr-2 -ml-1 h-5 w-5">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2 -mr-1 h-5 w-5">{iconRight}</span>}
    </button>
  )
})
Button.displayName = "Button"

// Export buttonVariants for use in other components
export const buttonVariants = (props?: { variant?: ButtonProps["variant"], size?: ButtonProps["size"] }) => {
  const variant = props?.variant || "primary"
  const size = props?.size || "md"
  const baseStyle =
    "inline-flex items-center justify-center border border-transparent rounded-lg shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200",
    secondary: "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 focus:ring-blue-500 border-slate-300 shadow-sm hover:shadow",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl",
    ghost: "bg-transparent hover:bg-blue-50 text-slate-700 hover:text-blue-700 focus:ring-blue-500 transition-colors",
    outline: "border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500 bg-white shadow-sm hover:shadow",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white focus:ring-emerald-500 shadow-lg hover:shadow-xl",
    successSoft: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-500 border-emerald-200 shadow-sm",
    dangerSoft: "bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-500 border-red-200 shadow-sm",
  }
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-9 w-9 p-0",
    default: "px-4 py-2 text-sm",
  }
  return `${baseStyle} ${variants[variant]} ${sizes[size]}`
}
