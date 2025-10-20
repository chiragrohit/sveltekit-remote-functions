import { query, getRequestEvent, command, form } from "$app/server";
import { z } from "zod";
import { db } from "$lib/server/database";
import {
	contents,
	reactions,
	contentComments,
	profiles,
} from "$lib/server/database/schema";
import { desc, like, eq, or, sql, and } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { contentCommentSchema } from "$lib/schema/content";

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

// Helper function to check authentication
async function checkAuth() {
	const event = getRequestEvent() as RequestEvent;
	if (!event.locals.user) {
		throw redirect(303, "/auth/login");
	}
}

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

// Fetch all contents with truncated body (no search query)
export const getAllContents = query(
	z.object({
		limit: z.number().optional().default(20),
		offset: z.number().optional().default(0),
	}),
	async (params) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		try {
			// Create a select query that truncates the body to 300 characters
			const selectFields = createSelectFields();

			// Return contents that either:
			// 1. Belong to the current user, or
			// 2. Are public and can be shown to everyone
			const results = await db
				.select(selectFields)
				.from(contents)
				.where(
					or(
						eq(contents.userId, event.locals.user.id), // User's own content
						eq(contents.visibility, "public") // Public content from others
					)
				)
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		} catch (error) {
			console.error("Error fetching contents:", error);
			throw new Error("Failed to fetch contents");
		}
	}
);

// Search contents in local database (with search query)
export const searchLocalContents = query(SearchParamsSchema, async (params) => {
	// Check authentication
	const event = getRequestEvent() as RequestEvent;
	if (!event.locals.user) {
		throw redirect(303, "/auth/login");
	}

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
						or(
							like(contents.title, `%${params.query}%`),
							like(contents.body, `%${params.query}%`)
						),
						or(
							eq(contents.userId, event.locals.user.id), // User's own content
							eq(contents.visibility, "public") // Public content from others
						)
					)
				)
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			console.log("🔍 Local Search Results:", results.length);

			return {
				contents: results,
			};
		} else {
			// No search query, return contents based on visibility rules
			const results = await db
				.select(selectFields)
				.from(contents)
				.where(
					or(
						eq(contents.userId, event.locals.user.id), // User's own content
						eq(contents.visibility, "public") // Public content from others
					)
				)
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		}
	} catch (error) {
		console.error("Error searching local contents:", error);
		throw new Error("Failed to search local contents");
	}
});

// Fetch content by ID
export const getContentById = query(
	z.object({ id: z.string() }),
	async ({ id }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		try {
			const result = await db
				.select()
				.from(contents)
				.where(
					and(
						eq(contents.id, id),
						or(
							eq(contents.userId, event.locals.user.id), // User's own content
							eq(contents.visibility, "public") // Public content from others
						)
					)
				)
				.limit(1);

			if (result.length === 0) {
				throw new Error("Content not found");
			}

			console.log("📰 Article Viewed:", result[0].url);

			return {
				content: result[0],
			};
		} catch (error) {
			console.error("Error fetching content by ID:", error);
			throw new Error("Failed to fetch content");
		}
	}
);

// Get user's reaction for a content item
export const getUserReaction = query(
	z.object({ contentId: z.string() }),
	async ({ contentId }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			return null;
		}

		const userId = event.locals.user.id;

		try {
			const result = await db
				.select()
				.from(reactions)
				.where(
					and(
						eq(reactions.userId, userId),
						eq(reactions.contentId, contentId)
					)
				)
				.limit(1);

			return result.length > 0 ? result[0].type : null;
		} catch (error) {
			console.error("Error fetching user reaction:", error);
			return null;
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

// Toggle content visibility
export const toggleContentVisibility = command(
	z.object({
		contentId: z.string(),
	}),
	async ({ contentId }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		try {
			// Get current content to check ownership and current visibility
			const contentResult = await db
				.select({
					userId: contents.userId,
					visibility: contents.visibility,
				})
				.from(contents)
				.where(eq(contents.id, contentId))
				.limit(1);

			if (contentResult.length === 0) {
				throw new Error("Content not found");
			}

			const content = contentResult[0];

			// Check if user owns this content
			if (content.userId !== userId) {
				throw new Error("Unauthorized: You don't own this content");
			}

			// Toggle visibility between 'public' and 'private'
			const newVisibility =
				content.visibility === "public" ? "private" : "public";

			// Update the visibility
			await db
				.update(contents)
				.set({
					visibility: newVisibility,
					updatedAt: new Date(),
				})
				.where(eq(contents.id, contentId));

			return {
				success: true,
				visibility: newVisibility,
			};
		} catch (error) {
			console.error("Error toggling content visibility:", error);
			throw new Error("Failed to toggle content visibility");
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

// Update like/dislike for content
export const updateLikeDislike = command(
	z.object({
		contentId: z.string(),
		reactionType: z.enum(["like", "dislike"]),
	}),
	async ({ contentId, reactionType }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		try {
			// Check if user already has this reaction
			const existingReactions = await db
				.select()
				.from(reactions)
				.where(
					and(
						eq(reactions.userId, userId),
						eq(reactions.contentId, contentId),
						eq(reactions.type, reactionType)
					)
				);

			if (existingReactions.length > 0) {
				// Remove reaction (toggle off)
				await db
					.delete(reactions)
					.where(
						and(
							eq(reactions.userId, userId),
							eq(reactions.contentId, contentId),
							eq(reactions.type, reactionType)
						)
					);

				// Decrement the appropriate counter
				if (reactionType === "like") {
					await db
						.update(contents)
						.set({
							likesCount: sql`${contents.likesCount} - 1`,
						})
						.where(eq(contents.id, contentId));
				} else {
					await db
						.update(contents)
						.set({
							dislikesCount: sql`${contents.dislikesCount} - 1`,
						})
						.where(eq(contents.id, contentId));
				}

				return {
					success: true,
					action: "removed",
					reactionType,
				};
			} else {
				// Check if user has the opposite reaction and remove it first
				const oppositeReaction =
					reactionType === "like" ? "dislike" : "like";
				const oppositeReactions = await db
					.select()
					.from(reactions)
					.where(
						and(
							eq(reactions.userId, userId),
							eq(reactions.contentId, contentId),
							eq(reactions.type, oppositeReaction)
						)
					);

				// Remove opposite reaction if it exists
				if (oppositeReactions.length > 0) {
					await db
						.delete(reactions)
						.where(
							and(
								eq(reactions.userId, userId),
								eq(reactions.contentId, contentId),
								eq(reactions.type, oppositeReaction)
							)
						);

					// Decrement the opposite counter
					if (oppositeReaction === "like") {
						await db
							.update(contents)
							.set({
								likesCount: sql`${contents.likesCount} - 1`,
							})
							.where(eq(contents.id, contentId));
					} else {
						await db
							.update(contents)
							.set({
								dislikesCount: sql`${contents.dislikesCount} - 1`,
							})
							.where(eq(contents.id, contentId));
					}
				}

				// Add new reaction
				await db.insert(reactions).values({
					userId,
					contentId,
					type: reactionType,
				});

				// Increment the appropriate counter
				if (reactionType === "like") {
					await db
						.update(contents)
						.set({
							likesCount: sql`${contents.likesCount} + 1`,
						})
						.where(eq(contents.id, contentId));
				} else {
					await db
						.update(contents)
						.set({
							dislikesCount: sql`${contents.dislikesCount} + 1`,
						})
						.where(eq(contents.id, contentId));
				}

				return {
					success: true,
					action: "added",
					reactionType,
				};
			}
		} catch (error) {
			console.error("Error updating like/dislike:", error);
			throw new Error("Failed to update like/dislike");
		}
	}
);

// Get user's created content
export const getUserContents = query(
	z.object({
		userId: z.string(),
		limit: z.number().optional().default(20),
		offset: z.number().optional().default(0),
	}),
	async (params) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		try {
			// Create a select query that truncates the body to 300 characters
			const selectFields = createSelectFields();

			// Return contents that belong to the specified user
			const results = await db
				.select(selectFields)
				.from(contents)
				.where(eq(contents.userId, params.userId))
				.orderBy(desc(contents.createdAt))
				.limit(params.limit)
				.offset(params.offset);

			return {
				contents: results,
			};
		} catch (error) {
			console.error("Error fetching user contents:", error);
			throw new Error("Failed to fetch user contents");
		}
	}
);

// Delete content by ID
export const deleteContent = command(
	z.object({
		contentId: z.string(),
	}),
	async ({ contentId }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		try {
			// Check if user owns this content
			const contentResult = await db
				.select({
					userId: contents.userId,
				})
				.from(contents)
				.where(eq(contents.id, contentId))
				.limit(1);

			if (contentResult.length === 0) {
				throw new Error("Content not found");
			}

			const content = contentResult[0];

			// Check if user owns this content
			if (content.userId !== userId) {
				throw new Error("Unauthorized: You don't own this content");
			}

			// Delete the content
			await db.delete(contents).where(eq(contents.id, contentId));

			return {
				success: true,
			};
		} catch (error) {
			console.error("Error deleting content:", error);
			throw new Error("Failed to delete content");
		}
	}
);

// Bulk toggle content visibility
export const bulkToggleContentVisibility = command(
	z.object({
		contentIds: z.array(z.string()),
		visibility: z.enum(["public", "private"]),
	}),
	async ({ contentIds, visibility }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		try {
			// Update visibility for all specified contents owned by the user
			await db
				.update(contents)
				.set({
					visibility: visibility,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(contents.userId, userId),
						sql`id IN (${sql.join(
							contentIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					)
				);

			return {
				success: true,
			};
		} catch (error) {
			console.error("Error bulk toggling content visibility:", error);
			throw new Error("Failed to bulk toggle content visibility");
		}
	}
);

// Bulk delete contents
export const bulkDeleteContents = command(
	z.object({
		contentIds: z.array(z.string()),
	}),
	async ({ contentIds }) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		try {
			// Delete all specified contents owned by the user
			await db.delete(contents).where(
				and(
					eq(contents.userId, userId),
					sql`id IN (${sql.join(
						contentIds.map((id) => sql`${id}`),
						sql`, `
					)})`
				)
			);

			return {
				success: true,
			};
		} catch (error) {
			console.error("Error bulk deleting contents:", error);
			throw new Error("Failed to bulk delete contents");
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
					createdAt:
						sql`datetime(${contentComments.createdAt})`.mapWith(
							Date
						),
					username: profiles.username,
					fullName: profiles.fullName,
				})
				.from(contentComments)
				.leftJoin(profiles, eq(contentComments.userId, profiles.id))
				.where(eq(contentComments.contentId, contentId))
				.orderBy(desc(contentComments.createdAt));

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

// Post a comment on content
export const postContentComment = form(
	contentCommentSchema,
	async (comment) => {
		// Check authentication
		const event = getRequestEvent() as RequestEvent;
		if (!event.locals.user) {
			throw redirect(303, "/auth/login");
		}

		const userId = event.locals.user.id;

		// Verify that the userId in the request matches the authenticated user
		if (comment.userId !== userId) {
			throw new Error("Unauthorized: User ID mismatch");
		}

		try {
			await db.insert(contentComments).values({
				contentId: comment.contentId,
				userId: comment.userId,
				comment: comment.comment,
			});

			return {
				success: true,
			};
		} catch (error) {
			console.error("Error posting content comment:", error);
			throw new Error("Failed to post comment");
		}
	}
);
