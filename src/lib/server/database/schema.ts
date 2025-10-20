import { sql } from "drizzle-orm";
import {
	sqliteTable,
	text,
	integer,
	numeric,
	blob,
	primaryKey,
} from "drizzle-orm/sqlite-core";

const timestamps = {
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(current_timestamp)`)
		.$onUpdate(() => new Date())
		.notNull(),
};

// Better Auth tables (already defined)
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	...timestamps,
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestamps,
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	...timestamps,
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	...timestamps,
});

// Posts and Comments tables (already defined)
export const posts = sqliteTable("posts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	authorId: text("author_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
	title: text("title").notNull(),
	slug: text("slug").notNull(),
	content: text("content"),
	likes: integer("likes").default(0),
	...timestamps,
});

export const comments = sqliteTable("comments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	postId: integer("post_id")
		.references(() => posts.id, { onDelete: "cascade" })
		.notNull(),
	author: text("author").notNull(),
	comment: text("comment").notNull(),
	...timestamps,
});

// Content Comments table (new)
export const contentComments = sqliteTable("content_comments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	contentId: text("content_id")
		.references(() => contents.id, { onDelete: "cascade" })
		.notNull(),
	userId: text("user_id")
		.references(() => profiles.id, { onDelete: "cascade" })
		.notNull(),
	comment: text("comment").notNull(),
	...timestamps,
});

// Replicating Supabase tables
export const profiles = sqliteTable("profiles", {
	id: text("id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	visibility: text("visibility").default("public"),
	preferences: blob("preferences", { mode: "json" })
		.$type<Record<string, unknown>>()
		.default({}),
	username: text("username").unique(),
	bio: text("bio"),
	socialLinks: blob("social_links", { mode: "json" })
		.$type<Record<string, unknown>>()
		.default({}),
	location: text("location"),
	...timestamps,
});

export const follows = sqliteTable(
	"follows",
	{
		followerId: text("follower_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		followingId: text("following_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" }).default(
			sql`(current_timestamp)`
		),
	},
	(table) => ({
		pk: primaryKey({
			name: "follows_pkey",
			columns: [table.followerId, table.followingId],
		}),
	})
);

export const connections = sqliteTable(
	"connections",
	{
		userA: text("user_a")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		userB: text("user_b")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		status: text("status").default("pending"),
		createdAt: integer("created_at", { mode: "timestamp" }).default(
			sql`(current_timestamp)`
		),
	},
	(table) => ({
		pk: primaryKey({
			name: "connections_pkey",
			columns: [table.userA, table.userB],
		}),
	})
);

export const contents = sqliteTable("contents", {
	id: text("id")
		.primaryKey()
		.default(sql`(uuid())`),
	sourceType: text("source_type").notNull(),
	contentHash: text("content_hash").unique(),
	userId: text("user_id").references(() => profiles.id, {
		onDelete: "cascade",
	}),
	visibility: text("visibility").default("private"),
	showOnProfile: integer("show_on_profile", { mode: "boolean" }).default(
		true
	),
	url: text("url"),
	title: text("title"),
	author: text("author"),
	body: text("body"),
	aiSummary: text("ai_summary"),
	aiQuestions: blob("ai_questions", { mode: "json" }).$type<
		Record<string, unknown>
	>(),
	thumbnail: text("thumbnail"),
	publishedAt: integer("published_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(current_timestamp)`
	),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(current_timestamp)`)
		.$onUpdate(() => new Date()),
	views: integer("views").default(0),
	likesCount: integer("likes_count").default(0),
	dislikesCount: integer("dislikes_count").default(0),
	embedding: blob("embedding"), // Vector type stored as blob
	rawData: blob("raw_data", { mode: "json" }).$type<
		Record<string, unknown>
	>(),
	favicon: text("favicon"),
});

export const reactions = sqliteTable(
	"reactions",
	{
		userId: text("user_id")
			.notNull()
			.references(() => profiles.id, { onDelete: "cascade" }),
		contentId: text("content_id")
			.notNull()
			.references(() => contents.id, { onDelete: "cascade" }),
		type: text("type", { enum: ["like", "dislike"] }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).default(
			sql`(current_timestamp)`
		),
	},
	(table) => ({
		pk: primaryKey({
			name: "reactions_pkey",
			columns: [table.userId, table.contentId, table.type],
		}),
	})
);

export const highlights = sqliteTable("highlights", {
	id: text("id")
		.primaryKey()
		.default(sql`(uuid())`),
	userId: text("user_id").references(() => profiles.id, {
		onDelete: "cascade",
	}),
	contentId: text("content_id").references(() => contents.id, {
		onDelete: "cascade",
	}),
	highlights: blob("highlights", { mode: "json" })
		.$type<Record<string, unknown>>()
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(current_timestamp)`
	),
});

export const userVectors = sqliteTable("user_vectors", {
	userId: text("user_id")
		.primaryKey()
		.references(() => profiles.id, { onDelete: "cascade" }),
	knowledgeVector: blob("knowledge_vector"), // Vector type stored as blob
	lastUpdated: integer("last_updated", { mode: "timestamp" })
		.default(sql`(current_timestamp)`)
		.$onUpdate(() => new Date()),
});

export const domainFollows = sqliteTable("domain_follows", {
	id: text("id")
		.primaryKey()
		.default(sql`(uuid())`),
	userId: text("user_id").references(() => profiles.id, {
		onDelete: "cascade",
	}),
	domain: text("domain").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(current_timestamp)`
	),
});

export const authorFollows = sqliteTable("author_follows", {
	id: text("id")
		.primaryKey()
		.default(sql`(uuid())`),
	userId: text("user_id").references(() => profiles.id, {
		onDelete: "cascade",
	}),
	authorName: text("author_name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(current_timestamp)`
	),
});
