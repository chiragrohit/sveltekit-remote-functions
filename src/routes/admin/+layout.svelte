<script lang="ts">
	import { getAuthorPosts } from "$lib/api/posts.remote";
	import { Button } from "$lib/components/ui/button";

	let { children } = $props();
</script>

<div class="flex min-h-screen">
	<aside class="w-64 border-r bg-muted p-4">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-bold">🪶 Posts</h2>
			<Button size="sm">
				<a href="/admin/create">+Create</a>
			</Button>
		</div>

		<ul class="space-y-2">
			{#each await getAuthorPosts() as post}
				<li>
					<a
						href="/admin/edit/{post.slug}"
						class="block truncate capitalize rounded p-2 hover:bg-accent hover:text-accent-foreground"
					>
						{post.title}
					</a>
				</li>
			{/each}
		</ul>
	</aside>

	<div class="flex-1 p-6">
		{@render children?.()}
	</div>
</div>
