<script lang="ts">
	import { searchPublicContents } from "$lib/api/feed.remote";
	import { onMount } from "svelte";
	import ContentCard from "$lib/components/content-card.svelte";
	import { authClient } from "$lib/auth-client";

	let contents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let currentUserId = $state<string | null>(null);
	let searchQuery = $state("");

	// Function to fetch search results
	const fetchSearchResults = async () => {
		if (!searchQuery.trim()) {
			contents = [];
			return;
		}

		isLoading = true;
		error = null;
		try {
			const response = await searchPublicContents({
				query: searchQuery.trim(),
				limit: 20,
				offset: 0,
			});
			contents = response.contents;
		} catch (err) {
			error = "Failed to fetch search results";
			console.error(err);
		} finally {
			isLoading = false;
		}
	};

	// Fetch contents when component mounts
	onMount(async () => {
		// Get current user ID (may be null if not logged in)
		const sessionData = await authClient.getSession();
		currentUserId = sessionData?.data?.user?.id || null;
	});

	// Handle search form submission
	function handleSearch(query: string) {
		searchQuery = query;
		fetchSearchResults();
	}
</script>

<div class="flex flex-1 flex-col gap-6 p-6">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold">Search Public Content</h1>
		<p class="text-muted-foreground mt-2">
			Find public content from our community
		</p>
	</div>

	<!-- Search form component -->
	<div class="max-w-2xl mx-auto w-full">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.target as HTMLFormElement);
				const query = formData.get("query") as string;
				handleSearch(query);
			}}
			class="flex gap-2"
		>
			<input
				type="text"
				name="query"
				placeholder="Search public content..."
				bind:value={searchQuery}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
			/>
			<button
				type="submit"
				class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
			>
				Search
			</button>
		</form>
	</div>

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
				<ContentCard {content} {currentUserId} />
			{:else}
				{#if searchQuery.trim()}
					<div class="text-center py-8 w-full">
						<p class="text-gray-500">
							No results found for "{searchQuery}"
						</p>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
