<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	let searchQuery = $state("");

	// Initialize search query from URL on component mount
	$effect(() => {
		const url = new URL(page.url);
		searchQuery = url.searchParams.get("q") || "";
	});

	const handleSearch = async (event: Event) => {
		event.preventDefault();
		if (!searchQuery.trim()) return;

		// Check if we're on the feed page
		const isFeedPage = page.url.pathname.startsWith("/feed");

		// Redirect to appropriate search page with query parameter
		if (isFeedPage) {
			goto(`/feed/search?q=${encodeURIComponent(searchQuery)}`);
		} else {
			goto(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
		}
	};
</script>

<form class="w-full max-w-2xl mx-auto mb-8" onsubmit={handleSearch}>
	<div class="flex gap-2">
		<Input
			type="text"
			placeholder="Search for content..."
			bind:value={searchQuery}
			class="flex-1"
		/>
		<Button type="submit">Search</Button>
	</div>
</form>
