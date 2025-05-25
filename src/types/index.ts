import type { ObjectId } from "mongodb"

export interface Category {
    _id: ObjectId
    name: string
    slug: string
    attributeSchema: AttributeSchema[]
    createdAt: Date
    updatedAt: Date
}

export interface AttributeSchema {
    name: string
    type: "string" | "number" | "boolean"
    required: boolean
}

export interface Listing {
    _id: ObjectId
    title: string
    description: string
    price: number
    location: string
    categoryId: ObjectId
    category?: Category
    attributes: Record<string, any>
    embedding?: number[]
    searchText?: string
    createdAt: Date
    updatedAt: Date
}

export interface SearchFilters {
    [key: string]: string[]
}

export interface FacetValue {
    value: string
    count: number
}

export interface SearchFacets {
    [key: string]: FacetValue[]
}

export interface SearchPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface SearchResponse {
    results: Listing[]
    facets: SearchFacets
    pagination: SearchPagination
    searchMethod: "semantic" | "text" | "hybrid"
    processingTime: number
}

export interface SimilarityResult {
    listing: Listing
    similarity: number
}

export interface EmbeddingCache {
    text: string
    embedding: number[]
    createdAt: Date
}
