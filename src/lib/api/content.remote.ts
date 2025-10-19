import { query, getRequestEvent } from "$app/server";
import { z } from "zod";
import { db } from "$lib/server/database";
import { contents } from "$lib/server/database/schema";
import { desc, like, eq, or } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";

// Define the content schema
const ContentSchema = z.object({
	id: z.string(),
	sourceType: z.string(),
	contentHash: z.string().nullable(),
	url: z.string().nullable(),
	title: z.string().nullable(),
	body: z.string().nullable(),
	thumbnail: z.string().nullable(),
	favicon: z.string().nullable(),
	publishedAt: z.number().nullable(),
	createdAt: z.number(),
	updatedAt: z.number(),
	views: z.number().default(0),
	likesCount: z.number().default(0),
	dislikesCount: z.number().default(0),
	rawData: z.record(z.unknown()).nullable(),
});

// Define the search parameters schema
const SearchParamsSchema = z.object({
	query: z.string().optional(),
	limit: z.number().optional().default(20),
	offset: z.number().optional().default(0),
});

// Define types
export type Content = z.infer<typeof ContentSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Helper function to check authentication
async function checkAuth() {
	const event = getRequestEvent();
	if (!event.locals.user) {
		throw redirect(303, "/auth/login");
	}
}

// Fetch all contents
export const getAllContents = query(SearchParamsSchema, async (params) => {
	// Check authentication
	await checkAuth();

	try {
		// If search query is provided, filter by title or body
		if (params.query) {
			const results = await db
				.select()
				.from(contents)
				.where(
					or(
						like(contents.title, `%${params.query}%`),
						like(contents.body, `%${params.query}%`)
					)
				)
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		} else {
			// No search query, return all contents
			const results = await db
				.select()
				.from(contents)
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		}
	} catch (error) {
		console.error("Error fetching contents:", error);
		throw new Error("Failed to fetch contents");
	}
});

// Fetch content by ID
export const getContentById = query(
	z.object({ id: z.string() }),
	async ({ id }) => {
		// Check authentication
		await checkAuth();

		try {
			const result = await db
				.select()
				.from(contents)
				.where(eq(contents.id, id))
				.limit(1);

			if (result.length === 0) {
				throw new Error("Content not found");
			}

			return {
				content: result[0],
			};
		} catch (error) {
			console.error("Error fetching content by ID:", error);
			throw new Error("Failed to fetch content");
		}
	}
);
