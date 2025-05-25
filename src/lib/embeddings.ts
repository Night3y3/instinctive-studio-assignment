import { pipeline } from "@xenova/transformers"

let embedder: any = null

export const getEmbedding = async (text: string): Promise<number[]> => {
    if (typeof window !== 'undefined') {
        throw new Error('getEmbedding should only be called on the server side')
    }

    try {
        if (!embedder) {
            console.log("Loading embedding model...")
            embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
            console.log("Embedding model loaded successfully")
        }

        const cleanText = text.trim().toLowerCase()
        if (!cleanText) {
            throw new Error("Empty text provided for embedding")
        }

        const output = await embedder(cleanText, { pooling: "mean", normalize: true })
        return Array.from(output.data) as number[]
    } catch (error) {
        console.error("Error generating embedding:", error)
        throw new Error(`Failed to generate embedding: ${error}`)
    }
}

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must have the same length")
    }

    let dot = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i]
        normA += vecA[i] ** 2
        normB += vecB[i] ** 2
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) {
        return 0
    }

    return dot / denominator
}

export interface Listing {
    title?: string
    description?: string
    location?: string
    attributes?: { [key: string]: string | number | boolean | null | undefined }
}

export const generateSearchText = (listing: Partial<Listing>): string => {
    const parts: string[] = []

    if (listing.title) parts.push(listing.title)
    if (listing.description) parts.push(listing.description)
    if (listing.location) parts.push(listing.location)

    // Add attributes
    if (listing.attributes) {
        Object.entries(listing.attributes).forEach(([key, value]) => {
            if (value && typeof value === "string") {
                parts.push(`${key} ${value}`)
            }
        })
    }

    return parts.join(" ").toLowerCase().trim()
}

export const batchGenerateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    const embeddings: number[][] = []

    for (const text of texts) {
        try {
            const embedding = await getEmbedding(text)
            embeddings.push(embedding)
        } catch (error) {
            console.error(`Failed to generate embedding for text: ${text}`, error)
            // Use zero vector as fallback
            embeddings.push(new Array(384).fill(0))
        }
    }

    return embeddings
}

export const SIMILARITY_THRESHOLD = 0.2 // Lowered for more inclusive results
export const HIGH_SIMILARITY_THRESHOLD = 0.7 // For very relevant results
export const MEDIUM_SIMILARITY_THRESHOLD = 0.5 // For moderately relevant results