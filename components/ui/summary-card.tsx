
import React from "react"
import { cn } from "@/lib/utils"

export function SummaryCard({ title, value, icon, className, textColor = "text-slate-700" }: any) {
    return (
        <div className={cn("p-4 rounded-xl transition-all duration-200", className)}>
            <div className="flex flex-col items-center text-center">
                {icon && <div className="mb-2">{icon}</div>}
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {title}
                </h4>
                <p className={cn("text-xl font-bold", textColor)}>
                    {value}
                </p>
            </div>
        </div>
    )
}
