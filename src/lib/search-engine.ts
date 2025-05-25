import type { Db } from "mongodb"
import type { Listing, SearchFilters, SimilarityResult } from "@/types"
import { getEmbedding, cosineSimilarity, SIMILARITY_THRESHOLD } from "@/lib/embeddings"

export class SearchEngine {
    private db: Db

    constructor(db: Db) {
        this.db = db
    }

    async semanticSearch(
        query: string,
        categoryId?: string,
        filters: SearchFilters = {},
        limit = 1000,
    ): Promise<SimilarityResult[]> {
        try {
            const queryEmbedding = await getEmbedding(query)

            const pipeline: any[] = []

            const matchStage: any = {
                embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
            }

            if (categoryId) {
                matchStage.categoryId = categoryId
            }

            Object.entries(filters).forEach(([key, values]) => {
                if (values.length > 0) {
                    matchStage[`attributes.${key}`] = { $in: values }
                }
            })

            pipeline.push({ $match: matchStage })

            pipeline.push({
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            })

            pipeline.push({
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            })

            const listings = await this.db.collection("listings").aggregate(pipeline).toArray()

            const similarities: SimilarityResult[] = []

            for (const listing of listings) {
                if (listing.embedding && Array.isArray(listing.embedding) && listing.embedding.length > 0) {
                    const similarity = cosineSimilarity(queryEmbedding, listing.embedding)

                    if (similarity >= SIMILARITY_THRESHOLD) {
                        similarities.push({
                            listing: listing as Listing,
                            similarity,
                        })
                    }
                }
            }

            return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
        } catch (error) {
            console.error("Semantic search error:", error)
            throw new Error("Failed to perform semantic search")
        }
    }

    async hybridSearch(
        query: string,
        categoryId?: string,
        filters: SearchFilters = {},
        limit = 1000,
    ): Promise<SimilarityResult[]> {
        try {
            const [semanticResults, textResults] = await Promise.all([
                this.semanticSearch(query, categoryId, filters, limit),
                this.textSearch(query, categoryId, filters, limit),
            ])

            const combinedResults = new Map<string, SimilarityResult>()
            semanticResults.forEach((result) => {
                const id = result.listing._id.toString()
                combinedResults.set(id, {
                    ...result,
                    similarity: result.similarity * 0.7,
                })
            })
            textResults.forEach((result) => {
                const id = result.listing._id.toString()
                const existing = combinedResults.get(id)

                if (existing) {
                    existing.similarity = Math.min(1.0, existing.similarity + result.similarity * 0.3)
                } else {
                    combinedResults.set(id, {
                        ...result,
                        similarity: result.similarity * 0.3,
                    })
                }
            })
            return Array.from(combinedResults.values())
                .filter((result) => result.similarity >= SIMILARITY_THRESHOLD)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
        } catch (error) {
            console.error("Hybrid search error:", error)
            throw new Error("Failed to perform hybrid search")
        }
    }

    private async textSearch(
        query: string,
        categoryId?: string,
        filters: SearchFilters = {},
        limit = 1000,
    ): Promise<SimilarityResult[]> {
        try {
            const pipeline: any[] = []

            const matchStage: any = {}

            if (query) {
                matchStage.$text = { $search: query }
            }

            if (categoryId) {
                matchStage.categoryId = categoryId
            }

            Object.entries(filters).forEach(([key, values]) => {
                if (values.length > 0) {
                    matchStage[`attributes.${key}`] = { $in: values }
                }
            })

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage })
            }

            if (query) {
                pipeline.push({ $addFields: { score: { $meta: "textScore" } } })
            }

            pipeline.push({
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            })

            pipeline.push({
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            })

            if (query) {
                pipeline.push({ $sort: { score: { $meta: "textScore" }, createdAt: -1 } })
            } else {
                pipeline.push({ $sort: { createdAt: -1 } })
            }

            pipeline.push({ $limit: limit })

            const results = await this.db.collection("listings").aggregate(pipeline).toArray()

            return results.map((listing) => ({
                listing: listing as Listing,
                similarity: listing.score ? Math.min(1.0, listing.score / 10) : 0.5, // Normalize text score
            }))
        } catch (error) {
            console.error("Text search error:", error)
            return []
        }
    }

    async generateFacets(
        categoryId?: string,
        filters: SearchFilters = {},
        query?: string,
    ): Promise<Record<string, any[]>> {
        try {
            const facets: Record<string, any[]> = {}

            const baseMatchStage: any = {}

            if (categoryId) {
                baseMatchStage.categoryId = categoryId
            }

            if (query && query.trim()) {
                try {
                    const searchResults = await this.hybridSearch(query, categoryId, {}, 1000)
                    const resultIds = searchResults.map((r) => r.listing._id)

                    if (resultIds.length > 0) {
                        baseMatchStage._id = { $in: resultIds }
                    }
                } catch (error) {
                    console.error("Error getting search results for facets:", error)
                }
            }

            if (categoryId) {
                const category = await this.db.collection("categories").findOne({ _id: categoryId })
                if (category?.attributeSchema) {
                    for (const attr of category.attributeSchema) {
                        const facetPipeline = [
                            { $match: baseMatchStage },
                            {
                                $group: {
                                    _id: `$attributes.${attr.name}`,
                                    count: { $sum: 1 },
                                },
                            },
                            { $match: { _id: { $ne: null, $ne: "", $exists: true } } },
                            { $sort: { count: -1 } },
                            { $limit: 20 },
                        ]

                        const facetResults = await this.db.collection("listings").aggregate(facetPipeline).toArray()
                        if (facetResults.length > 0) {
                            facets[attr.name] = facetResults.map((r) => ({
                                value: r._id,
                                count: r.count,
                            }))
                        }
                    }
                }
            } else {
                const generalFacets = [
                    "brand",
                    "color",
                    "size",
                    "material",
                    "condition",
                    "screenSize",
                    "resolution",
                    "displayType",
                ]

                for (const facetKey of generalFacets) {
                    const facetPipeline = [
                        { $match: baseMatchStage },
                        {
                            $group: {
                                _id: `$attributes.${facetKey}`,
                                count: { $sum: 1 },
                            },
                        },
                        { $match: { _id: { $ne: null, $ne: "", $exists: true } } },
                        { $sort: { count: -1 } },
                        { $limit: 15 },
                    ]

                    const facetResults = await this.db.collection("listings").aggregate(facetPipeline).toArray()
                    if (facetResults.length > 0) {
                        facets[facetKey] = facetResults.map((r) => ({
                            value: r._id,
                            count: r.count,
                        }))
                    }
                }

                const categoryFacetPipeline = [
                    { $match: baseMatchStage },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                    { $unwind: "$category" },
                    {
                        $group: {
                            _id: "$category.name",
                            count: { $sum: 1 },
                            slug: { $first: "$category.slug" },
                        },
                    },
                    { $sort: { count: -1 } },
                ]

                const categoryResults = await this.db.collection("listings").aggregate(categoryFacetPipeline).toArray()
                if (categoryResults.length > 0) {
                    facets.category = categoryResults.map((r) => ({
                        value: r._id,
                        count: r.count,
                        slug: r.slug,
                    }))
                }
            }

            return facets
        } catch (error) {
            console.error("Facet generation error:", error)
            return {}
        }
    }
}
