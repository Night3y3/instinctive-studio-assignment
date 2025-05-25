"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Filter, X, Search } from "lucide-react"

interface SearchFiltersProps {
    facets: Record<string, any[]>
    filters: Record<string, string[]>
    onFilterChange: (key: string, values: string[]) => void
    onClearFilters: () => void
    loading: boolean
    hasSearched: boolean
}

export function SearchFilters({
    facets,
    filters,
    onFilterChange,
    onClearFilters,
    loading,
    hasSearched,
}: SearchFiltersProps) {
    const handleCheckboxChange = (facetKey: string, value: string, checked: boolean) => {
        const currentValues = filters[facetKey] || []
        const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value)

        onFilterChange(facetKey, newValues)
    }

    const activeFilterCount = Object.values(filters).flat().length
    const hasFacets = Object.keys(facets).length > 0

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </CardTitle>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs">
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {!hasSearched ? (
                    <div className="text-center py-8">
                        <Search className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Perform a search to see available filters</p>
                    </div>
                ) : !hasFacets ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-slate-500">No filters available for current search</p>
                    </div>
                ) : (
                    Object.entries(facets).map(([facetKey, facetValues]) => (
                        <div key={facetKey} className="space-y-3">
                            <Label className="text-sm font-medium capitalize">{facetKey.replace(/([A-Z])/g, " $1").trim()}</Label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {facetValues.map((facetValue) => (
                                    <div key={facetValue.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`${facetKey}-${facetValue.value}`}
                                            checked={(filters[facetKey] || []).includes(facetValue.value)}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(facetKey, facetValue.value, checked as boolean)
                                            }
                                        />
                                        <Label
                                            htmlFor={`${facetKey}-${facetValue.value}`}
                                            className="text-sm flex-1 cursor-pointer hover:text-slate-900"
                                        >
                                            <span className="truncate">{facetValue.value}</span>
                                            <span className="text-slate-400 ml-1">({facetValue.count})</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {activeFilterCount > 0 && (
                    <div className="pt-4 border-t">
                        <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(filters).map(([key, values]) =>
                                values.map((value) => (
                                    <Badge key={`${key}-${value}`} variant="secondary" className="flex items-center gap-1 text-xs">
                                        <span className="truncate max-w-20">{key}:</span>
                                        <span className="truncate max-w-16">{value}</span>
                                        <button
                                            onClick={() => handleCheckboxChange(key, value, false)}
                                            className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                        >
                                            <X className="h-2 w-2" />
                                        </button>
                                    </Badge>
                                )),
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
