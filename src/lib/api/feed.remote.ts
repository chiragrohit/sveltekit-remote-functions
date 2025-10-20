import { query } from "$app/server";
import { z } from "zod";
import { db } from "$lib/server/database";
import {
	contents,
	contentComments,
	profiles,
} from "$lib/server/database/schema";
import { desc, eq, like, or, sql, and } from "drizzle-orm";

// Define the content schema for truncated data
// Note: The database returns Date objects for timestamp fields, not numbers
const ContentSchema = z.object({
	id: z.string(),
	sourceType: z.string(),
	contentHash: z.string().nullable(),
	userId: z.string().nullable(),
	visibility: z.string().nullable(),
	showOnProfile: z.boolean().nullable(),
	url: z.string().nullable(),
	title: z.string().nullable(),
	author: z.string().nullable(),
	body: z.string().nullable(),
	aiSummary: z.string().nullable(),
	aiQuestions: z.record(z.unknown()).nullable(),
	thumbnail: z.string().nullable(),
	publishedAt: z.date().nullable(),
	createdAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	views: z.number().nullable().default(0),
	likesCount: z.number().nullable().default(0),
	dislikesCount: z.number().nullable().default(0),
	embedding: z.unknown().nullable(), // Vector type stored as blob
	favicon: z.string().nullable(),
	// Removed rawData from schema
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

// Helper function to create select fields with truncated body
const createSelectFields = () => ({
	id: contents.id,
	sourceType: contents.sourceType,
	contentHash: contents.contentHash,
	userId: contents.userId,
	visibility: contents.visibility,
	showOnProfile: contents.showOnProfile,
	url: contents.url,
	title: contents.title,
	author: contents.author,
	// Truncate body to 300 characters for faster loading
	body: sql`substr(${contents.body}, 1, 300)`.as("body"),
	aiSummary: contents.aiSummary,
	aiQuestions: contents.aiQuestions,
	thumbnail: contents.thumbnail,
	publishedAt: contents.publishedAt,
	createdAt: contents.createdAt,
	updatedAt: contents.updatedAt,
	views: contents.views,
	likesCount: contents.likesCount,
	dislikesCount: contents.dislikesCount,
	embedding: contents.embedding,
	favicon: contents.favicon,
	// Exclude rawData for faster loading
});

// Fetch all public contents with truncated body (no search query)
export const getAllPublicContents = query(
	z.object({
		limit: z.number().optional().default(20),
		offset: z.number().optional().default(0),
	}),
	async (params) => {
		try {
			// Create a select query that truncates the body to 300 characters
			const selectFields = createSelectFields();

			// Return only public contents
			const results = await db
				.select(selectFields)
				.from(contents)
				.where(eq(contents.visibility, "public"))
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		} catch (error) {
			console.error("Error fetching public contents:", error);
			throw new Error("Failed to fetch public contents");
		}
	}
);

// Search public contents in local database (with search query)
export const searchPublicContents = query(
	SearchParamsSchema,
	async (params) => {
		try {
			// Create a select query that truncates the body to 300 characters
			const selectFields = createSelectFields();

			// If search query is provided, filter by title or body
			if (params.query) {
				const results = await db
					.select(selectFields)
					.from(contents)
					.where(
						and(
							like(contents.title, `%${params.query}%`),
							eq(contents.visibility, "public")
						)
					)
					.orderBy(desc(contents.createdAt))
					.limit(params.limit)
					.offset(params.offset);

				console.log("🔍 Public Search Results:", results.length);

				return {
					contents: results,
				};
			} else {
				// No search query, return public contents
				const results = await db
					.select(selectFields)
					.from(contents)
					.where(eq(contents.visibility, "public"))
					.orderBy(desc(contents.createdAt))
					.limit(params.limit)
					.offset(params.offset);

				return {
					contents: results,
				};
			}
		} catch (error) {
			console.error("Error searching public contents:", error);
			throw new Error("Failed to search public contents");
		}
	}
);

// Fetch public content by ID
export const getPublicContentById = query(
	z.object({ id: z.string() }),
	async ({ id }) => {
		try {
			const result = await db
				.select()
				.from(contents)
				.where(
					and(eq(contents.id, id), eq(contents.visibility, "public"))
				)
				.limit(1);

			if (result.length === 0) {
				throw new Error("Content not found");
			}

			console.log("📰 Public Article Viewed:", result[0].url);

			return {
				content: result[0],
			};
		} catch (error) {
			console.error("Error fetching public content by ID:", error);
			throw new Error("Failed to fetch public content");
		}
	}
);

// Get content comments
export const getContentComments = query(
	z.object({ contentId: z.string() }),
	async ({ contentId }) => {
		try {
			const comments = await db
				.select({
					id: contentComments.id,
					userId: contentComments.userId,
					comment: contentComments.comment,
					createdAt: sql`datetime(${contentComments.createdAt})`,
					username: profiles.username,
					fullName: profiles.fullName,
				})
				.from(contentComments)
				.leftJoin(profiles, eq(contentComments.userId, profiles.id))
				.where(eq(contentComments.contentId, contentId))
				.orderBy(desc(contentComments.createdAt));

			console.log(comments);
			return comments.map((comment) => ({
				...comment,
				displayName:
					comment.fullName || comment.username || "Anonymous User",
			}));
		} catch (error) {
			console.error("Error fetching content comments:", error);
			return [];
		}
	}
);

// Get content likes count
export const getContentLikes = query(
	z.object({ contentId: z.string() }),
	async ({ contentId }) => {
		try {
			const result = await db
				.select({
					likesCount: contents.likesCount,
				})
				.from(contents)
				.where(eq(contents.id, contentId))
				.limit(1);

			return result.length > 0 ? result[0].likesCount ?? 0 : 0;
		} catch (error) {
			console.error("Error fetching content likes:", error);
			return 0;
		}
	}
);

// Get content dislikes count
export const getContentDislikes = query(
	z.object({ contentId: z.string() }),
	async ({ contentId }) => {
		try {
			const result = await db
				.select({
					dislikesCount: contents.dislikesCount,
				})
				.from(contents)
				.where(eq(contents.id, contentId))
				.limit(1);

			return result.length > 0 ? result[0].dislikesCount ?? 0 : 0;
		} catch (error) {
			console.error("Error fetching content dislikes:", error);
			return 0;
		}
	}
);

// Get user's reaction for a content item (always returns null for unauthenticated users)
export const getUserReaction = query(
	z.object({ contentId: z.string() }),
	async ({ contentId }) => {
		// For unauthenticated users, always return null
		return null;
	}
);
