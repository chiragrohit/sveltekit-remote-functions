import { query, getRequestEvent } from "$app/server";
import { z } from "zod";
import { env as privateEnv } from "$env/dynamic/private";
import { db } from "$lib/server/database";
import { contents } from "$lib/server/database/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { redirect } from "@sveltejs/kit";

// Define the search result schema
const SearchResultSchema = z.object({
	id: z.string(),
	title: z.string(),
	url: z.string(),
	content: z.string().optional(),
	score: z.number().optional(),
	publishedDate: z.number().optional(),
	image: z.string().optional(),
	favicon: z.string().optional(),
});

// Define the search response schema
const SearchResponseSchema = z.object({
	results: z.array(SearchResultSchema),
});

// Define the search parameters schema
const SearchParamsSchema = z.object({
	query: z.string(),
	type: z.enum(["fast", "neural"]).optional().default("fast"),
	maxResults: z.number().optional().default(4),
});

// Define the search result type
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Helper function to check authentication
async function checkAuth() {
	const event = getRequestEvent();
	if (!event.locals.user) {
		throw redirect(303, "/auth/login");
	}
	return event.locals.user;
}

// EXA API search function
export const search = query(SearchParamsSchema, async (params) => {
	// Check authentication
	const user = await checkAuth();

	// Get API key from environment variables (server-side only)
	const apiKey = privateEnv.EXA_API_KEY || import.meta.env.VITE_EXA_API_KEY;

	if (!apiKey) {
		throw new Error("EXA API key is not configured");
	}
	console.log("EXA API params:", params);
	try {
		// Call EXA API
		const response = await fetch("https://api.exa.ai/search", {
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json",
				"x-api-key": apiKey,
			},
			body: JSON.stringify({
				query: params.query,
				type: params.type,
				numResults: params.maxResults,
				contents: {
					text: {
						includeHtmlTags: true,
					},
				},
			}),
		});

		if (!response.ok) {
			throw new Error(
				`EXA API request failed with status ${response.status}`
			);
		}

		const data = await response.json();
		console.log("Search Done");

		// Transform the EXA API response to our format
		const results: SearchResult[] = data.results.map(
			(item: any, index: number) => ({
				id: item.id || index.toString(),
				title: item.title || "Untitled",
				url: item.url,
				content: item.text || undefined,
				score: item.score,
				publishedDate: item.publishedDate,
				image: item.image, // Include image if available
				favicon: item.favicon, // Include favicon if available
			})
		);

		// Return results immediately to avoid delaying the response
		const searchResponse = {
			results,
		};

		// Store results in the contents table asynchronously after returning the response
		// This ensures the user gets the results immediately without waiting for database operations
		storeSearchResults(results, user.id).catch((error) => {
			console.error("Failed to store search results:", error);
		});

		return searchResponse;
	} catch (error) {
		console.error("EXA API error:", error);
		throw new Error("Failed to fetch search results from EXA API");
	}
});

// Function to generate a hash for content deduplication
function generateContentHash(content: string): string {
	return createHash("sha256").update(content).digest("hex");
}

// Function to store search results in the database asynchronously
async function storeSearchResults(results: SearchResult[], userId: string) {
	for (const result of results) {
		try {
			// Generate hash for content deduplication
			const contentToHash = `${result.url}|${result.title}|${result.content}`;
			const contentHash = generateContentHash(contentToHash);

			// Check if content with this hash already exists
			const existingContent = await db
				.select()
				.from(contents)
				.where(eq(contents.contentHash, contentHash))
				.limit(1);

			if (existingContent.length === 0) {
				// Insert new content with raw data - no processing as requested
				await db.insert(contents).values({
					sourceType: "exa_search",
					contentHash: contentHash,
					userId: userId, // Associate with the user who performed the search
					url: result.url,
					title: result.title,
					body: result.content,
					thumbnail: result.image,
					favicon: result.favicon,
					publishedAt: result.publishedDate
						? new Date(result.publishedDate)
						: null,
					rawData: result,
				});
			}
		} catch (error) {
			console.error(`Failed to store result for ${result.url}:`, error);
			// Continue with other results even if one fails
		}
	}
}
