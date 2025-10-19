<script lang="ts">
	import data from "./data.js";
	import SearchForm from "$lib/components/search-form.svelte";
	import { getAllContents } from "$lib/api/content.remote";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card";

	let contents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Function to format timestamp to readable date
	function formatPublishedDate(timestamp: number | null): string {
		if (!timestamp) return "Unknown date";

		// Convert Unix timestamp to milliseconds
		const date = new Date(timestamp);

		// Check if date is valid
		if (isNaN(date.getTime())) return "Invalid date";

		// Format as "Month Day, Year"
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	// Function to fetch all contents
	const fetchContents = async () => {
		isLoading = true;
		error = null;
		try {
			const response = await getAllContents({
				limit: 20,
				offset: 0,
			});
			contents = response.contents;
		} catch (err) {
			error = "Failed to fetch contents";
			console.error(err);
		} finally {
			isLoading = false;
		}
	};

	// Fetch contents when component mounts
	onMount(async () => {
		await fetchContents();
	});
</script>

<div class="flex flex-1 flex-col gap-6 p-6">
	<SearchForm />

	{#if isLoading}
		<div class="flex justify-center items-center h-32">
			<div
				class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
			></div>
		</div>
	{:else if error}
		<div
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
			role="alert"
		>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else}
		<div class="flex flex-wrap gap-6 items-center justify-center">
			{#each contents as content}
				<Card.Root class="h-[450px] w-[350px] flex flex-col">
					<Card.Header class="pb-2">
						<Card.Title class="text-lg line-clamp-2 flex-grow">
							{content.title || "Untitled"}
						</Card.Title>
					</Card.Header>
					<Card.Content class="flex-grow flex flex-col gap-4">
						<div class="flex-grow">
							{#if content.thumbnail}
								<img
									src={content.thumbnail}
									alt={content.title || "Content thumbnail"}
									class="w-full h-32 object-cover rounded-md"
									onerror={(e) => {
										const target =
											e.currentTarget as HTMLImageElement;
										target.style.display = "none";
									}}
								/>
							{/if}

							{#if content.body}
								<p
									class="text-sm text-muted-foreground line-clamp-3 mt-3"
								>
									{content.body}
								</p>
							{/if}
						</div>
						<div
							class="flex justify-between items-center text-xs text-muted-foreground"
						>
							{#if content.publishedAt}
								<span
									>Published: {formatPublishedDate(
										content.publishedAt
									)}</span
								>
							{:else}
								<span>Published: Unknown date</span>
							{/if}
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
			{:else}
				<div class="text-center py-8 w-full">
					<p class="text-gray-500">No contents available</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
