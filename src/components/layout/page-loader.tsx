'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PageLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Hide loader when page/route changes
        setIsLoading(false)
    }, [pathname, searchParams])

    // Hide loader after initial mount (app has started)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500)
        return () => clearTimeout(timer)
    }, [])

    if (!isLoading) return null

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center z-50">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Spinning logo */}
                <img
                    src="/images/ovomonie-watermark.png"
                    alt="OVOMONIE Loading"
                    className="w-20 h-20 object-contain animate-spin"
                    onError={(e) => {
                        // Fallback if PNG not available
                        e.currentTarget.style.display = 'none'
                    }}
                />
                {/* Fallback spinner if image fails */}
                <svg
                    className="absolute w-20 h-20 text-blue-600 animate-spin"
                    style={{ display: 'none' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
            {/* Optional loading text */}
            <div className="absolute bottom-20 text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading OVOMONIE...</p>
            </div>
        </div>
    )
}
