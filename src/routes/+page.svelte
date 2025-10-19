<script lang="ts">
	import { getPosts } from "$lib/api/posts.remote";
</script>

<h1 class="text-3xl font-bold mb-6">Latest posts</h1>

<div class="space-y-4">
	{#each await getPosts() as post}
		<div class="border rounded-lg p-4 hover:bg-accent">
			<a
				href="/{post.slug}"
				class="capitalize text-lg font-medium hover:underline"
				>{post.title}</a
			>
		</div>
	{:else}
		<p class="text-muted-foreground">No posts found</p>
	{/each}
</div>
