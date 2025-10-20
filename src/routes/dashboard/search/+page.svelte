<script lang="ts">
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import SearchResultCard from "$lib/components/search-result-card.svelte";
	import { search } from "$lib/api/exa.remote";
	import { searchLocalContents } from "$lib/api/content.remote";

	import { getUser, signout } from "$lib/api/auth.remote";
	const user = await getUser();

	// Get search query from URL
	let searchQuery = $state("");
	let allContents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Function to fetch contents using EXA API
	const fetchExaContents = async (query: string = "") => {
		if (!query.trim()) {
			return [];
		}

		try {
			const response = await search({
				query: query,
				type: "fast",
				maxResults: 4,
			});

			// Add source information to each result
			return response.results.map((item: any) => ({
				...item,
				source: "Exa",
			}));
		} catch (err) {
			console.error("EXA API error:", err);
			return [];
		}
	};

	// Function to fetch contents from local database
	const fetchLocalContents = async (query: string = "") => {
		if (!query.trim()) {
			return [];
		}

		try {
			const response = await searchLocalContents({
				query: query,
				limit: 10,
				offset: 0,
			});

			// Add source information to each result
			return response.contents.map((item: any) => ({
				...item,
				source: "DB",
			}));
		} catch (err) {
			console.error("Local search error:", err);
			return [];
		}
	};

	// Function to fetch contents from both sources
	const fetchAllContents = async (query: string = "") => {
		if (!query.trim()) {
			allContents = [];
			return;
		}

		isLoading = true;
		error = null;
		try {
			// Fetch from both sources in parallel
			const [exaResults, localResults] = await Promise.all([
				fetchExaContents(query),
				fetchLocalContents(query),
			]);

			// Combine results
			allContents = [...exaResults, ...localResults];
		} catch (err) {
			error = "Failed to fetch search results";
			console.error(err);
			allContents = [];
		} finally {
			isLoading = false;
		}
	};

	// Fetch contents when component mounts
	onMount(async () => {
		// Get search query from URL parameters
		searchQuery = page.url.searchParams.get("q") || "";

		// Fetch contents based on search query
		await fetchAllContents(searchQuery);
	});

	// Re-fetch contents when URL changes
	$effect(() => {
		const newSearchQuery = page.url.searchParams.get("q") || "";
		if (newSearchQuery !== searchQuery) {
			searchQuery = newSearchQuery;
			fetchAllContents(searchQuery);
		}
	});
</script>

<div class="flex flex-1 flex-col gap-6 p-6">
	<div class="@container/main flex flex-1 flex-col gap-2">
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
				{#each allContents as content}
					<SearchResultCard {content} />
				{:else}
					<div class="text-center py-8 w-full">
						<p class="text-gray-500">
							{#if searchQuery}
								No results found for "{searchQuery}"
							{/if}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
