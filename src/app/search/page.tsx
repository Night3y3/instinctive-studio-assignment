"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-6">Search</h1>
            <form onSubmit={() => { console.log(query) }} className="w-full max-w-md">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 transition-colors"
                    >

                    </button>
                </div>
            </form>
        </div>
    );
}