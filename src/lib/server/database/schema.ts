import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

const timestamps = {
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(current_timestamp)`)
		.$onUpdate(() => new Date())
		.notNull(),
}

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	...timestamps,
})

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	...timestamps,
})

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', {
		mode: 'timestamp',
	}),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', {
		mode: 'timestamp',
	}),
	scope: text('scope'),
	password: text('password'),
	...timestamps,
})

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	...timestamps,
})

export const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	authorId: text('author_id')
		.references(() => user.id, { onDelete: 'cascade' })
		.notNull(),
	title: text('title').notNull(),
	slug: text('slug').notNull(),
	content: text('content'),
	likes: integer('likes').default(0),
	...timestamps,
})

export const comments = sqliteTable('comments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	postId: integer('post_id')
		.references(() => posts.id, { onDelete: 'cascade' })
		.notNull(),
	author: text('author').notNull(),
	comment: text('comment').notNull(),
	...timestamps,
})

export type Session = typeof session.$inferSelect
export type User = typeof user.$inferSelect
