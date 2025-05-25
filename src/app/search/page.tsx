"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
import { AddItemDialog } from "@/components/add-item-dialog"
import { SearchFilters } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"
import { SearchPagination } from "@/components/search-pagination"

interface SearchResponse {
    results: any[]
    facets: Record<string, any[]>
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    searchMethod?: string
    processingTime?: number
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const [category, setCategory] = useState(searchParams.get("category") || "")
    const [filters, setFilters] = useState<Record<string, string[]>>({})
    const [currentPage, setCurrentPage] = useState(Number.parseInt(searchParams.get("page") || "1"))
    const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        const filtersParam = searchParams.get("filters")
        if (filtersParam) {
            try {
                setFilters(JSON.parse(decodeURIComponent(filtersParam)))
            } catch (e) {
                console.error("Failed to parse filters:", e)
            }
        }
    }, [searchParams])

    useEffect(() => {
        const pageParam = searchParams.get("page")
        if (pageParam) {
            setCurrentPage(Number.parseInt(pageParam))
        }
    }, [searchParams])

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/categories")
            const data = await response.json()
            setCategories(data)
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        }
    }

    const performSearch = useCallback(
        async (page = 1) => {
            setLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                if (searchQuery) params.set("q", searchQuery)
                if (category && category !== "all") params.set("category", category)
                if (Object.keys(filters).length > 0) {
                    params.set("filters", JSON.stringify(filters))
                }
                params.set("page", page.toString())
                params.set("limit", "6")

                const response = await fetch(`/api/search?${params}`)
                if (!response.ok) {
                    throw new Error("Search failed")
                }

                const data = await response.json()
                setSearchResults(data)
                setCurrentPage(page)
            } catch (error) {
                setError("Failed to perform search. Please try again.")
                console.error("Search error:", error)
            } finally {
                setLoading(false)
            }
        },
        [searchQuery, category, filters],
    )

    const updateURL = useCallback(
        (page = 1) => {
            const params = new URLSearchParams()
            if (searchQuery) params.set("q", searchQuery)
            if (category && category !== "all") params.set("category", category)
            if (Object.keys(filters).length > 0) {
                params.set("filters", encodeURIComponent(JSON.stringify(filters)))
            }
            if (page > 1) params.set("page", page.toString())

            router.push(`/search?${params.toString()}`, { scroll: false })
        },
        [searchQuery, category, filters, router],
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setHasSearched(true)
        setCurrentPage(1)
        performSearch(1)
        updateURL(1)
    }

    const handleFilterChange = (key: string, values: string[]) => {
        const newFilters = { ...filters }
        if (values.length === 0) {
            delete newFilters[key]
        } else {
            newFilters[key] = values
        }
        setFilters(newFilters)
        setCurrentPage(1)

        if (hasSearched) {
            setTimeout(() => {
                performSearch(1)
                updateURL(1)
            }, 100)
        }
    }

    const clearFilters = () => {
        setFilters({})
        setCurrentPage(1)
        if (hasSearched) {
            setTimeout(() => {
                performSearch(1)
                updateURL(1)
            }, 100)
        }
    }

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory)
        setFilters({})
        setCurrentPage(1)

        if (hasSearched) {
            setTimeout(() => {
                performSearch(1)
                updateURL(1)
            }, 100)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        performSearch(page)
        updateURL(page)
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Products</h1>
                            <p className="text-slate-600">Find the perfect business products and suppliers</p>
                        </div>
                        <Button onClick={() => setShowAddDialog(true)} className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        placeholder="Search products, suppliers, or descriptions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <Select value={category} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.slug} value={cat.slug}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" disabled={loading}>
                                    <Search className="mr-2 h-4 w-4" />
                                    {loading ? "Searching..." : "Search"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <SearchFilters
                            facets={searchResults?.facets || {}}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearFilters}
                            loading={loading}
                            hasSearched={hasSearched}
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <SearchResults
                            results={searchResults?.results || []}
                            loading={loading}
                            pagination={searchResults?.pagination}
                            searchResults={{
                                searchMethod: searchResults?.searchMethod,
                                processingTime: searchResults?.processingTime,
                            }}
                            hasSearched={hasSearched}
                        />

                        {searchResults?.pagination && searchResults.pagination.totalPages > 1 && (
                            <SearchPagination
                                pagination={searchResults.pagination}
                                onPageChange={handlePageChange}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>
            </div>

            <AddItemDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                categories={categories}
                onItemAdded={() => {
                    setShowAddDialog(false)
                    if (hasSearched) {
                        performSearch(currentPage)
                    }
                }}
            />
        </div>
    )
}
