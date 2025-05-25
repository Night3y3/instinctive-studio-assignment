import { type NextRequest, NextResponse } from "next/server"
import type { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/db"
import { SearchEngine } from "@/lib/search-engine"
import type { SearchFilters } from "@/types"

export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get("q") || ""
        const category = searchParams.get("category") || ""
        const filtersParam = searchParams.get("filters") || "{}"
        const page = Number.parseInt(searchParams.get("page") || "1")
        const limit = Number.parseInt(searchParams.get("limit") || "6")
        const searchMethod = searchParams.get("method") || "hybrid"

        let filters: SearchFilters = {}
        try {
            filters = JSON.parse(filtersParam)
        } catch (e) {
            console.error("Failed to parse filters:", e)
        }

        const { db } = await connectToDatabase()
        const searchEngine = new SearchEngine(db)

        let categoryId: ObjectId | undefined
        if (category && category !== "all") {
            const categoryDoc = await db.collection("categories").findOne({ slug: category })
            if (categoryDoc) {
                categoryId = categoryDoc._id
            }
        }

        let results: any[] = []
        let total = 0
        let searchMethodUsed = "text"

        if (q.trim()) {
            try {
                let allResults: any[] = []

                switch (searchMethod) {
                    case "semantic":
                        allResults = await searchEngine.semanticSearch(q, categoryId, filters, 1000)
                        searchMethodUsed = "semantic"
                        break
                    case "hybrid":
                        allResults = await searchEngine.hybridSearch(q, categoryId, filters, 1000)
                        searchMethodUsed = "hybrid"
                        break
                    default:
                        allResults = await searchEngine.hybridSearch(q, categoryId, filters, 1000)
                        searchMethodUsed = "text"
                }

                const allListings = allResults.map((result) => ({
                    ...result.listing,
                    _similarity: result.similarity,
                }))

                total = allListings.length

                const startIndex = (page - 1) * limit
                results = allListings.slice(startIndex, startIndex + limit)

                console.log(
                    `${searchMethodUsed} search found ${total} total results, showing ${results.length} for page ${page}`,
                )
            } catch (error) {
                console.error("Semantic search failed, falling back to database pagination:", error)

                const pipeline: any[] = []
                const matchStage: any = { $text: { $search: q } }

                if (categoryId) {
                    matchStage.categoryId = categoryId
                }

                Object.entries(filters).forEach(([key, values]) => {
                    if (values.length > 0) {
                        matchStage[`attributes.${key}`] = { $in: values }
                    }
                })

                const countPipeline = [{ $match: matchStage }, { $count: "total" }]
                const countResult = await db.collection("listings").aggregate(countPipeline).toArray()
                total = countResult[0]?.total || 0

                pipeline.push({ $match: matchStage })
                pipeline.push({ $addFields: { score: { $meta: "textScore" } } })
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
                pipeline.push({ $sort: { score: { $meta: "textScore" }, createdAt: -1 } })
                pipeline.push({ $skip: (page - 1) * limit })
                pipeline.push({ $limit: limit })

                results = await db.collection("listings").aggregate(pipeline).toArray()
                searchMethodUsed = "text"
            }
        } else {
            const pipeline: any[] = []
            const matchStage: any = {}

            if (categoryId) {
                matchStage.categoryId = categoryId
            }

            Object.entries(filters).forEach(([key, values]) => {
                if (values.length > 0) {
                    matchStage[`attributes.${key}`] = { $in: values }
                }
            })

            const countPipeline =
                Object.keys(matchStage).length > 0 ? [{ $match: matchStage }, { $count: "total" }] : [{ $count: "total" }]
            const countResult = await db.collection("listings").aggregate(countPipeline).toArray()
            total = countResult[0]?.total || 0

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage })
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
            pipeline.push({ $sort: { createdAt: -1 } })
            pipeline.push({ $skip: (page - 1) * limit })
            pipeline.push({ $limit: limit })

            results = await db.collection("listings").aggregate(pipeline).toArray()
            searchMethodUsed = "filter"
        }

        const facets = await searchEngine.generateFacets(categoryId, filters, q)

        const totalPages = Math.ceil(total / limit)
        const processingTime = Date.now() - startTime

        return NextResponse.json({
            results,
            facets,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
            searchMethod: searchMethodUsed,
            processingTime,
        })
    } catch (error) {
        console.error("Search API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
