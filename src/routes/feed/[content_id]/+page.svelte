<script lang="ts">
	import {
		getPublicContentById,
		getContentComments,
		getContentLikes,
		getContentDislikes,
	} from "$lib/api/feed.remote";
	import {
		postContentComment,
		updateLikeDislike,
		getUserReaction as getAuthenticatedUserReaction,
	} from "$lib/api/content.remote";
	import { onMount } from "svelte";
	import type { Content } from "$lib/api/feed.remote";
	import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
	import {
		UserRoundPen,
		Calendar1,
		Eye,
		ThumbsUp,
		ThumbsDown,
		ExternalLink,
	} from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Label } from "$lib/components/ui/label";
	import { authClient } from "$lib/auth-client";
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { goto } from "$app/navigation";

	let { params } = $props();

	let content: Content | null = $state(null);
	let isLoading = $state(true);
	let errorMessage = $state<string | null>(null);
	let currentUserId = $state<string | null>(null);
	let comments = $state<any[]>([]);
	let newComment = $state("");
	let userReaction = $state<string | null>(null);
	let likesCount = $state(0);
	let dislikesCount = $state(0);

	// Function to format timestamp to readable date
	function formatPublishedDate(dateValue: Date | null): string {
		if (!dateValue) return "Unknown date";

		// Check if date is valid
		if (!(dateValue instanceof Date) || isNaN(dateValue.getTime()))
			return "Invalid date";

		// Format as "Month Day, Year"
		return dateValue.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	// Function to format timestamp to readable date and time
	function formatDateTime(dateValue: Date | string | null): string {
		if (!dateValue) return "Unknown time";

		// Convert string to Date if needed
		let dateObj: Date;
		if (typeof dateValue === "string") {
			dateObj = new Date(dateValue);
		} else if (dateValue instanceof Date) {
			dateObj = dateValue;
		} else {
			return "Invalid time";
		}

		// Check if date is valid
		if (isNaN(dateObj.getTime())) return "Invalid time";

		// Format as "Month Day, Year at HH:MM AM/PM"
		return dateObj.toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	}

	onMount(async () => {
		try {
			// Get contentId from the page params
			const contentId = params.content_id;

			// Make sure contentId is defined before calling the remote function
			if (!contentId) {
				throw new Error("Content ID is missing");
			}

			// Get current user ID
			const sessionData = await authClient.getSession();
			currentUserId = sessionData?.data?.user?.id || null;

			const response = await getPublicContentById({ id: contentId });
			content = response.content;

			// Get comments
			comments = await getContentComments({ contentId });

			// Get initial counts
			likesCount = await getContentLikes({ contentId });
			dislikesCount = await getContentDislikes({ contentId });

			// Get user's current reaction if logged in
			if (currentUserId) {
				const reaction = await getAuthenticatedUserReaction({
					contentId,
				});
				userReaction = reaction;
			}
		} catch (err) {
			console.error("Error fetching content:", err);
			errorMessage = "Failed to load article";
		} finally {
			isLoading = false;
		}
	});

	// Function to handle login redirect
	function handleLoginRedirect() {
		goto("/auth/login");
	}

	// Check if user is logged in
	function isLoggedIn(): boolean {
		return !!currentUserId;
	}

	// Function to handle like/dislike
	async function handleReaction(reactionType: "like" | "dislike") {
		if (!content || !isLoggedIn()) return;

		try {
			// Call the command
			await updateLikeDislike({
				contentId: content.id,
				reactionType,
			});

			// Get the updated reaction status
			const reaction = await getAuthenticatedUserReaction({
				contentId: content.id,
			});
			userReaction = reaction;

			// Update counts
			likesCount = await getContentLikes({ contentId: content.id });
			dislikesCount = await getContentDislikes({ contentId: content.id });
		} catch (err) {
			console.error("Error updating reaction:", err);
		}
	}
</script>

{#if isLoading}
	<div class="flex flex-1 flex-col gap-6 p-6 md:p-8 max-w-4xl mx-auto">
		<div class="flex flex-col gap-4">
			<!-- Thumbnail skeleton -->
			<Skeleton class="w-full h-64 rounded-lg" />

			<!-- Title skeleton -->
			<Skeleton class="h-8 w-3/4 rounded" />

			<!-- Metadata skeleton -->
			<div class="flex flex-wrap items-center gap-4">
				<Skeleton class="h-4 w-24 rounded" />
				<Skeleton class="h-4 w-32 rounded" />
				<Skeleton class="h-4 w-20 rounded" />
			</div>

			<!-- Summary skeleton -->
			<div class="flex flex-col gap-2">
				<Skeleton class="h-4 w-32 rounded" />
				<Skeleton class="h-4 w-full rounded" />
				<Skeleton class="h-4 w-5/6 rounded" />
			</div>

			<!-- Content skeleton -->
			<div class="flex flex-col gap-3">
				<Skeleton class="h-4 w-full rounded" />
				<Skeleton class="h-4 w-full rounded" />
				<Skeleton class="h-4 w-4/5 rounded" />
				<Skeleton class="h-4 w-3/4 rounded" />
				<Skeleton class="h-4 w-5/6 rounded" />
				<Skeleton class="h-4 w-full rounded" />
				<Skeleton class="h-4 w-2/3 rounded" />
			</div>
		</div>
	</div>
{:else if errorMessage}
	<div class="flex justify-center items-center min-h-screen">
		<div
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl w-full"
			role="alert"
		>
			<strong class="font-bold">Error! </strong>
			<span class="block sm:inline">{errorMessage}</span>
		</div>
	</div>
{:else if content}
	<div class="flex flex-1 flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto mt-6">
		<div class="flex flex-col gap-4 bg-card p-6 border rounded-lg">
			{#if content.thumbnail}
				<img
					src={content.thumbnail}
					alt={content.title || "Article thumbnail"}
					class="w-full h-64 object-cover rounded-lg"
					onerror={(e) => {
						const target = e.currentTarget as HTMLImageElement;
						target.style.display = "none";
					}}
				/>
			{/if}

			<!-- Header with metadata info -->
			<header class="border-b border-border pb-6 mb-6">
				<div class="flex justify-between items-start">
					<h1 class="text-3xl font-bold leading-tight mb-4">
						{content.title || "Untitled"}
					</h1>

					{#if content.url}
						<a
							href={content.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink class="h-4 w-4 ml-2" />
						</a>
					{/if}
				</div>

				<div
					class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
				>
					{#if content.author}
						<span class="flex items-center gap-2">
							<UserRoundPen class="h-6 w-6" />
							{content.author}
						</span>
					{/if}

					{#if content.publishedAt}
						<span class="flex items-center gap-2">
							<Calendar1 class="h-6 w-6" />
							{formatPublishedDate(content.publishedAt)}
						</span>
					{/if}

					<!-- LikesCount -->
					<span class="flex items-center gap-2">
						<Button
							variant={userReaction === "like"
								? "default"
								: "outline"}
							size="sm"
							class="flex items-center gap-2"
							onclick={() => handleReaction("like")}
							disabled={!isLoggedIn()}
						>
							<ThumbsUp class="h-4 w-4" />
							{likesCount}
						</Button>
					</span>

					<span class="flex items-center gap-2">
						<Button
							variant={userReaction === "dislike"
								? "default"
								: "outline"}
							size="sm"
							class="flex items-center gap-2"
							onclick={() => handleReaction("dislike")}
							disabled={!isLoggedIn()}
						>
							<ThumbsDown class="h-4 w-4" />
							{dislikesCount}
						</Button>
					</span>

					<span class="flex items-center gap-2">
						<Eye class="h-6 w-6" />
						{content.views} views
					</span>
				</div>
			</header>

			{#if content.aiSummary}
				<div class="bg-muted p-5 rounded-lg mb-6">
					<h2 class="font-semibold mb-2 text-lg">AI Summary</h2>
					<p class="text-foreground">{content.aiSummary}</p>
				</div>
			{/if}
		</div>

		<div
			class="prose max-w-none dark:prose-invert prose-lg prose-zinc overflow-hidden p-6"
		>
			{#if content.body}
				<div class="overflow-x-auto">{@html content.body}</div>
			{:else}
				<p class="text-muted-foreground">No content available.</p>
			{/if}
		</div>

		<!-- Comments Section -->
		<Card>
			<CardHeader>
				<CardTitle>Comments ({comments.length})</CardTitle>
			</CardHeader>
			<CardContent>
				<!-- Comments List -->

				<div class="space-y-4 mb-6">
					{#each comments as comment}
						<div class="border rounded-lg p-4">
							<div class="flex justify-between items-start mb-2">
								<span class="font-semibold">
									{comment.displayName}
								</span>
								<span class="text-sm text-muted-foreground">
									{formatDateTime(comment.createdAt)}
								</span>
							</div>
							<p class="mt-1">{comment.comment}</p>
						</div>
					{:else}
						<p class="text-muted-foreground">
							No comments yet. Be the first to comment!
						</p>
					{/each}
				</div>

				<!-- Comment Form -->
				{#if isLoggedIn()}
					<div class="border-t pt-4">
						<h3 class="text-lg font-semibold mb-3">
							Leave a comment
						</h3>
						<form
							{...postContentComment.enhance(
								({ submit }: any) => {
									submit().then(() => {
										// Clear the comment field
										newComment = "";
										// Refresh comments
										getContentComments({
											contentId: content?.id || "",
										}).then((newComments) => {
											comments = newComments;
										});
									});
								}
							)}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="comment">Comment</Label>
								<Textarea
									{...postContentComment.fields.comment.as(
										"text"
									)}
									id="comment"
									rows={4 as any}
								/>
								{#each postContentComment.fields.comment.issues() ?? [] as issue}
									<p class="text-sm text-destructive">
										{issue.message}
									</p>
								{/each}
							</div>

							<input
								type="hidden"
								name="contentId"
								value={content?.id}
							/>

							<input
								type="hidden"
								name="userId"
								value={currentUserId}
							/>

							<Button
								type="submit"
								disabled={!!postContentComment.pending}
							>
								{#if postContentComment.pending}
									Posting...
								{:else}
									Post comment
								{/if}
							</Button>
						</form>
					</div>
				{:else}
					<p class="text-muted-foreground text-center py-4">
						Please <a
							href="/auth/login"
							class="text-primary hover:underline"
							onclick={(e) => {
								e.preventDefault();
								handleLoginRedirect();
							}}>log in</a
						> to post a comment or like/dislike content.
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>
{:else}
	<div class="flex justify-center items-center min-h-screen">
		<div class="text-center">
			<h2 class="text-2xl font-bold mb-2">Article Not Found</h2>
			<p class="text-muted-foreground">
				The requested article could not be found.
			</p>
		</div>
	</div>
{/if}
