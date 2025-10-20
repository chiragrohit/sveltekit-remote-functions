<script lang="ts">
	import * as Card from "$lib/components/ui/card";
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
			{#if content.url}
				<a
					href={content.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-blue-600 hover:underline inline-block"
				>
					Read more →
				</a>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
