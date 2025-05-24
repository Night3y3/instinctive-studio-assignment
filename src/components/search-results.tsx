"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, DollarSign, Package } from "lucide-react"

interface SearchResultsProps {
    results: any[]
    loading: boolean
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export function SearchResults({ results, loading, pagination }: SearchResultsProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    {pagination ? `${pagination.total} Results` : `${results.length} Results`}
                </h2>
                {pagination && (
                    <p className="text-sm text-slate-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                )}
            </div>

            {results.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
                        <p className="text-slate-600">
                            Try adjusting your search terms or filters to find what you&apos;re looking for.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {results.map((item) => (
                        <Card key={item._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{item.title}</h3>
                                            <p className="text-slate-600 text-sm line-clamp-2">{item.description}</p>
                                        </div>
                                        {item.price > 0 && (
                                            <div className="flex items-center text-green-600 font-semibold ml-4">
                                                <DollarSign className="h-4 w-4 mr-1" />
                                                {item.price.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        {item.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {item.location}
                                            </div>
                                        )}
                                        {item.category && (
                                            <Badge variant="outline" className="text-xs">
                                                {item.category.name}
                                            </Badge>
                                        )}
                                    </div>
                                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(item.attributes)
                                                .slice(0, 5)
                                                .map(([key, value]) => (
                                                    <Badge key={key} variant="secondary" className="text-xs">
                                                        {key}: {value as string}
                                                    </Badge>
                                                ))}
                                            {Object.keys(item.attributes).length > 5 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{Object.keys(item.attributes).length - 5} more
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
