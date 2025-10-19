<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import SiteHeader from "$lib/components/site-header.svelte";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card";
	import { search } from "$lib/api/exa.remote";

	import { getUser, signout } from "$lib/api/auth.remote";
	const user = await getUser();

	// Get search query from URL
	let searchQuery = $state("");
	let contents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Function to format timestamp to readable date
	function formatPublishedDate(dateString: string | undefined): string {
		if (!dateString) return "Unknown date";

		// Convert date string to Date object
		const date = new Date(dateString);

		// Check if date is valid
		if (isNaN(date.getTime())) return "Invalid date";

		// Format as "Month Day, Year"
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

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
		searchQuery = $page.url.searchParams.get("q") || "";

		// Fetch contents based on search query
		await fetchContents(searchQuery);
	});

	// Re-fetch contents when URL changes
	$effect(() => {
		const newSearchQuery = $page.url.searchParams.get("q") || "";
		if (newSearchQuery !== searchQuery) {
			searchQuery = newSearchQuery;
			fetchContents(searchQuery);
		}
	});
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" />
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
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
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
						>
							{#each contents as content}
								<Card.Root class="h-[450px] flex flex-col">
									<Card.Header class="pb-2">
										<Card.Title
											class="text-lg line-clamp-2 flex-grow"
										>
											{content.title || "Untitled"}
										</Card.Title>
									</Card.Header>
									<Card.Content
										class="flex-grow flex flex-col gap-3"
									>
										<div class="flex-grow">
											{#if content.image}
												<img
													src={content.image}
													alt={content.title ||
														"Content thumbnail"}
													class="w-full h-32 object-cover rounded-md"
													onerror={(e) => {
														const target =
															e.currentTarget as HTMLImageElement;
														target.style.display =
															"none";
													}}
												/>
											{/if}

											{#if content.content}
												<p
													class="text-sm text-muted-foreground line-clamp-3 mt-2"
												>
													{content.content}
												</p>
											{/if}
										</div>
										<div
											class="flex justify-between items-center text-xs text-muted-foreground"
										>
											{#if content.publishedDate}
												<span
													>Published: {formatPublishedDate(
														content.publishedDate
													)}</span
												>
											{:else}
												<span
													>Published: Unknown date</span
												>
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
								<div class="text-center py-8 col-span-full">
									<p class="text-gray-500">
										{#if searchQuery}
											No results found for "{searchQuery}"
										{:else}
											No contents available
										{/if}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
