import { error, redirect } from '@sveltejs/kit'
import { command, form, getRequestEvent, query } from '$app/server'
import { eq, sql } from 'drizzle-orm'
import * as z from 'zod'
import { db } from '$lib/server/database'
import * as table from '$lib/server/database/schema'
import { updatePostSchema, postCommentSchema, createPostSchema } from '$lib/schema/posts'
import { delay } from '$lib/utils'

function requireAuth() {
	const { locals } = getRequestEvent()

	if (!locals.user) {
		redirect(307, '/auth/login')
	}

	return locals.user
}

export const getPosts = query(async () => {
	const posts = await db.select().from(table.posts)
	return posts
})

export const getAuthorPosts = query(async () => {
	const user = requireAuth()
	const posts = await db.select().from(table.posts).where(eq(table.posts.authorId, user.id))
	return posts
})

export const getPost = query(z.string(), async (slug) => {
	const [post] = await db.select().from(table.posts).where(eq(table.posts.slug, slug))
	if (!post) error(404, 'Post not found')
	return post
})

export const createPost = form(createPostSchema, async (post) => {
	await delay(300)
	const user = requireAuth()
	await db.insert(table.posts).values({ ...post, authorId: user.id })
	redirect(303, `/admin/edit/${post.slug}`)
})

export const updatePost = form(updatePostSchema, async ({ id, title, slug, content }) => {
	await delay(300)
	await db.update(table.posts).set({ title, slug, content }).where(eq(table.posts.id, id))
})

export const removePost = form(updatePostSchema, async ({ id }) => {
	await delay(300)
	await db.delete(table.posts).where(eq(table.posts.id, id))
	redirect(303, `/admin`)
})

export const getPostLikes = query(z.number(), async (id) => {
	const [{ likes }] = await db
		.select({ likes: table.posts.likes })
		.from(table.posts)
		.where(eq(table.posts.id, id))
	return likes ?? 0
})

export const likePost = command(z.number(), async (id) => {
	await delay(2000)
	await db
		.update(table.posts)
		.set({ likes: sql`${table.posts.likes} + 1` })
		.where(eq(table.posts.id, id))
	getPostLikes(id).refresh()
})

export const getPostComments = query(z.number(), async (id) => {
	const comments = await db.select().from(table.comments).where(eq(table.comments.postId, id))
	return comments
})

export const postComment = form(postCommentSchema, async (comment) => {
	await delay(300)
	await db.insert(table.comments).values(comment)
})
