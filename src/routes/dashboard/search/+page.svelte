<script lang="ts">
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import ContentCard from "$lib/components/content-card.svelte";
	import { search } from "$lib/api/exa.remote";

	import { getUser, signout } from "$lib/api/auth.remote";
	const user = await getUser();

	// Get search query from URL
	let searchQuery = $state("");
	let contents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Function to fetch contents using EXA API
	const fetchContents = async (query: string = "") => {
		if (!query.trim()) {
			contents = [];
			return;
		}

		isLoading = true;
		error = null;
		try {
			const response = await search({
				query: query,
				type: "fast",
				maxResults: 4,
			});
			contents = response.results;
		} catch (err) {
			error = "Failed to fetch search results";
			console.error(err);
			contents = [];
		} finally {
			isLoading = false;
		}
	};

	// Fetch contents when component mounts
	onMount(async () => {
		// Get search query from URL parameters
		searchQuery = page.url.searchParams.get("q") || "";

		// Fetch contents based on search query
		await fetchContents(searchQuery);
	});

	// Re-fetch contents when URL changes
	$effect(() => {
		const newSearchQuery = page.url.searchParams.get("q") || "";
		if (newSearchQuery !== searchQuery) {
			searchQuery = newSearchQuery;
			fetchContents(searchQuery);
		}
	});
</script>

<div class="flex flex-1 flex-col gap-6 p-6">
	<div class="@container/main flex flex-1 flex-col gap-2">
		<div class="flex flex-wrap gap-6 items-center justify-center">
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
				{#each contents as content}
					<ContentCard {content} />
				{:else}
					<div class="text-center py-8 w-full">
						<p class="text-gray-500">
							{#if searchQuery}
								No results found for "{searchQuery}"
							{:else}
								No contents available
							{/if}
						</p>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
