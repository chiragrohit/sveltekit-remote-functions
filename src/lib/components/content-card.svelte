<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { goto } from "$app/navigation";
	import { Image, Globe, Lock } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { page } from "$app/state";

	export let content: any = {};
	export let isLoading: boolean = false;
	export let currentUserId: string | null = null;

	// Function to format timestamp to readable date
	function formatPublishedDate(
		dateValue: number | string | null | undefined
	): string {
		if (!dateValue) return "Unknown date";

		let date: Date;
		if (typeof dateValue === "number") {
			// Convert Unix timestamp to milliseconds
			date = new Date(dateValue);
		} else {
			// Handle string dates
			date = new Date(dateValue);
		}

		// Check if date is valid
		if (isNaN(date.getTime())) return "Invalid date";

		// Format as "Month Day, Year"
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	// Determine the image source based on content type
	function getImageSrc(): string | null {
		// For dashboard content
		if (content.thumbnail) return content.thumbnail;
		// For search results
		if (content.image) return content.image;
		return null;
	}

	// Determine the content text based on content type
	function getContentText(): string | null {
		// For dashboard content
		if (content.body) return content.body;
		// For search results
		if (content.content) return content.content;
		return null;
	}

	// Determine the published date based on content type
	function getPublishedDate(): number | string | null {
		// For dashboard content (Unix timestamp)
		if (content.publishedAt) return content.publishedAt;
		// For search results (string date)
		if (content.publishedDate) return content.publishedDate;
		return null;
	}

	// Check if content is public
	function isPublicContent(): boolean {
		const visibility = content.visibility || "private";
		return visibility.toLowerCase() === "public";
	}

	// Get visibility label
	function getVisibilityLabel(): string {
		return isPublicContent() ? "Public" : "Private";
	}

	// Get visibility class
	function getVisibilityClass(): string {
		return isPublicContent() ? "text-green-600" : "text-gray-600";
	}

	// Check if the current user is the owner of this content
	function isContentOwner(): boolean {
		return content.userId === currentUserId;
	}

	// Navigate to the full article page
	function goToArticle() {
		// For dashboard content with ID
		if (content.id) {
			// Check if we're on the feed page
			const isFeedPage = page.url.pathname.startsWith("/feed");

			if (isFeedPage) {
				goto(`/feed/${content.id}`);
			} else {
				goto(`/dashboard/article/${content.id}`);
			}
		}
		// For search results with URL
		else if (content.url) {
			window.open(content.url, "_blank");
		}
	}
</script>

{#if isLoading}
	<div class="flex justify-center items-center h-32">
		<div
			class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
		></div>
	</div>
{:else}
	<Card.Root class="h-[450px] w-[350px] flex flex-col relative">
		{#if isContentOwner()}
			<div class="absolute top-2 right-2 z-10">
				<Badge variant="default">You</Badge>
			</div>
		{/if}
		<Card.Header class="pb-2">
			<Card.Title class="text-lg line-clamp-2 flex-grow">
				{content.title || "Untitled"}
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex-grow flex flex-col gap-4">
			<div class="flex-grow">
				{#if getImageSrc()}
					<img
						src={getImageSrc()}
						alt={content.title || "Content thumbnail"}
						class="w-full h-32 object-cover rounded-md"
						onerror={(e) => {
							const target = e.currentTarget as HTMLImageElement;
							target.style.display = "none";
						}}
					/>
				{:else}
					<div
						class="w-full h-32 rounded-md bg-muted flex items-center justify-center"
					>
						<Image class="h-12 w-12 text-muted-foreground" />
					</div>
				{/if}

				{#if getContentText()}
					<p class="text-sm text-muted-foreground line-clamp-3 mt-3">
						{@html getContentText()}
					</p>
				{/if}
			</div>
			<div
				class="flex justify-between items-center text-xs text-muted-foreground"
			>
				<span>Published: {formatPublishedDate(getPublishedDate())}</span
				>
				{#if content.visibility && isContentOwner()}
					<div class="flex items-center gap-1">
						{#if isPublicContent()}
							<Globe class="h-4 w-4 {getVisibilityClass()}" />
						{:else}
							<Lock class="h-4 w-4 {getVisibilityClass()}" />
						{/if}
						<span class={getVisibilityClass()}
							>{getVisibilityLabel()}</span
						>
					</div>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if content.url || content.id}
					<Button variant="secondary" onclick={() => goToArticle()}>
						Read more
					</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{/if}
