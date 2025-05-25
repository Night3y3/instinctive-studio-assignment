This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Quick Start

1. **Clone and install**:
   \`\`\`bash
   git clone [<repository-url>](https://github.com/Night3y3/instinctive-studio-assignment.git)
   cd instinctive-studio-assignment
   bun install
   \`\`\`

2. **Start MongoDB**:
   \`\`\`bash

   # Local MongoDB

   mongod

   # Or with Docker

   docker run -d -p 27017:27017 --name mongodb mongo:latest
   \`\`\`

3. **Seed database with embeddings**:
   \`\`\`bash
   bun run seed
   \`\`\`

4. **Start development server**:
   \`\`\`bash
   bun run dev
   \`\`\`

5. **Open browser**: [http://localhost:3000](http://localhost:3000)

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Bun

## 🔧 API Endpoints

### GET /api/search

Advanced search with semantic capabilities.

**Parameters:**

- \`q\` (string): Search query
- \`category\` (string): Category filter
- \`filters\` (JSON): Attribute filters
- \`method\` (string): "semantic" | "hybrid" | "text"
- \`page\`, \`limit\`: Pagination

**Response:**
\`\`\`typescript
{
results: Listing[],
facets: SearchFacets,
pagination: Pagination,
searchMethod: string,
processingTime: number
}
\`\`\`

### GET /api/categories

Get all categories with their attribute schemas.

### POST /api/add

Create a new listing.

**Body:**
\`\`\`typescript
{
title: string,
description: string,
price: number,
location: string,
categoryId: string,
attributes: Record<string, any>
}
\`\`\`
