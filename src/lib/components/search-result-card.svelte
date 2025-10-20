<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { goto } from "$app/navigation";
	import { Image } from "@lucide/svelte";

	export let content: any = {};
	export let isLoading: boolean = false;

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

	// Navigate to the full article page
	function goToArticle() {
		// For DB content with ID
		if (content.source === "DB" && content.id) {
			goto(`/dashboard/article/${content.id}`);
		}
		// For Exa content or dashboard content with URL
		else if (content.url) {
			window.open(content.url, "_blank");
		}
		// For dashboard content with ID (fallback)
		else if (content.id) {
			goto(`/dashboard/article/${content.id}`);
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
	<Card.Root class="h-[450px] w-[350px] flex flex-col">
		<Card.Header class="pb-2">
			<div class="flex justify-between items-start">
				<Card.Title class="text-lg line-clamp-2 flex-grow">
					{content.title || "Untitled"}
				</Card.Title>
				{#if content.source}
					<Badge variant="default">
						{content.source}
					</Badge>
				{/if}
			</div>
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
						{getContentText()}
					</p>
				{/if}
			</div>
			<div
				class="flex justify-between items-center text-xs text-muted-foreground"
			>
				<span>Published: {formatPublishedDate(getPublishedDate())}</span
				>
			</div>
			<div class="flex gap-2">
				{#if content.url || content.id}
					<button
						onclick={() => goToArticle()}
						class="text-sm text-blue-600 hover:underline inline-block"
					>
						Read more →
					</button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{/if}
