"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface SearchPaginationProps {
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    onPageChange: (page: number) => void
    loading?: boolean
}

export function SearchPagination({ pagination, onPageChange, loading = false }: SearchPaginationProps) {
    const { page, totalPages, total, limit } = pagination

    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i)
                }
                pages.push("...")
                pages.push(totalPages)
            } else if (page >= totalPages - 2) {
                pages.push(1)
                pages.push("...")
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push("...")
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i)
                }
                pages.push("...")
                pages.push(totalPages)
            }
        }

        return pages
    }

    const startItem = (page - 1) * limit + 1
    const endItem = Math.min(page * limit, total)

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="text-sm text-slate-600">
                Showing {startItem}-{endItem} of {total} results
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1 || loading}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                {getPageNumbers().map((pageNum, index) => (
                    <Button
                        key={index}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof pageNum === "number" && onPageChange(pageNum)}
                        disabled={pageNum === "..." || loading}
                        className="min-w-[40px]"
                    >
                        {pageNum === "..." ? <MoreHorizontal className="h-4 w-4" /> : pageNum}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages || loading}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
