import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"

export async function GET() {
    try {
        const { db } = await connectToDatabase()
        const categories = await db.collection("categories").find({}).toArray()

        return NextResponse.json(categories)
    } catch (error) {
        console.error("Categories API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
