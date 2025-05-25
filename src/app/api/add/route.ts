import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { generateSearchText, getEmbedding } from "@/lib/embeddings"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, description, price, location, categoryId, attributes } = body

        if (!title || !description || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { db } = await connectToDatabase()

        const searchText = generateSearchText({
            title,
            description,
            location,
            attributes,
        })

        let embedding: number[] | undefined
        try {
            embedding = await getEmbedding(searchText)
            console.log(`Generated embedding for listing: ${title}`)
        } catch (error) {
            console.error("Failed to generate embedding for new listing:", error)
        }

        const listing = {
            title,
            description,
            price: price || 0,
            location: location || "",
            categoryId: new ObjectId(categoryId),
            attributes: attributes || {},
            embedding,
            searchText,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await db.collection("listings").insertOne(listing)

        return NextResponse.json({
            _id: result.insertedId,
            ...listing,
        })
    } catch (error) {
        console.error("Create listing error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { db } = await connectToDatabase()

        const listings = await db
            .collection("listings")
            .aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                {
                    $unwind: {
                        path: "$category",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 50 },
            ])
            .toArray()

        return NextResponse.json(listings)
    } catch (error) {
        console.error("Get listings error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
