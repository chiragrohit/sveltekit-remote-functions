<script lang="ts">
	import { getPosts } from "$lib/api/posts.remote";
	import { Button } from "$lib/components/ui/button";
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8 text-foreground">Latest Posts</h1>

	<div class="space-y-6">
		{#each await getPosts() as post}
			<div
				class="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:bg-accent"
			>
				<div class="p-6">
					<a href="/blog/{post.slug}" class="block group">
						<h2
							class="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors"
						>
							{post.title}
						</h2>

						{#if post.content}
							<p class="text-muted-foreground mb-4 line-clamp-1">
								{@html post.content}
							</p>
						{/if}

						<div class="flex items-center justify-between">
							{#if post.likes !== null && post.likes !== undefined}
								<div class="text-sm text-muted-foreground">
									<span
										>{post.likes}
										{post.likes === 1
											? "like"
											: "likes"}</span
									>
								</div>
							{:else}
								<div></div>
							{/if}
						</div>
					</a>
				</div>
			</div>
		{:else}
			<div
				class="rounded-lg border bg-card text-card-foreground shadow-sm p-12 text-center"
			>
				<p class="text-muted-foreground">No posts found</p>
			</div>
		{/each}
	</div>
</div>
