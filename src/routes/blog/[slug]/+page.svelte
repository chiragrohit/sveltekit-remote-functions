<script lang="ts">
	import {
		getPostLikes,
		getPost,
		getPosts,
		likePost,
		postComment,
		getPostComments,
	} from "$lib/api/posts.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { isAuthenticated } from "$lib/api/auth.remote";

	let { params } = $props();

	const post = $derived(await getPost(params.slug));
</script>

<div class="flex flex-col lg:flex-row gap-8 mx-auto max-w-6xl py-6">
	<div class="lg:w-2/3 space-y-6">
		<Card>
			<CardHeader>
				<CardTitle class="text-3xl">{post.title}</CardTitle>
				{#if post.authorName}
					<p class="text-sm text-muted-foreground">
						By {post.authorName}
					</p>
				{/if}
			</CardHeader>
			<CardContent>
				<div class="prose max-w-none">{@html post.content}</div>
			</CardContent>
		</Card>

		{#if !(await isAuthenticated())}
			<Button variant="outline" class="flex items-center gap-2" disabled>
				❤️ {await getPostLikes(post.id)}
			</Button>
		{:else}
			<Button
				onclick={() => {
					likePost(post.id).updates(
						getPostLikes(post.id).withOverride((likes) => likes + 1)
					);
				}}
				variant="outline"
				class="flex items-center gap-2"
			>
				❤️ {await getPostLikes(post.id)}
			</Button>
		{/if}

		<Card>
			<CardHeader>
				<CardTitle>Comments</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each await getPostComments(post.id) as { author, comment }}
						<div class="border rounded-lg p-4">
							<h6 class="font-semibold">@{author}</h6>
							<p class="mt-1">{comment}</p>
						</div>
					{:else}
						<p class="text-muted-foreground">No comments</p>
					{/each}
				</div>

				<div class="mt-8">
					{#if !(await isAuthenticated())}
						<p class="text-muted-foreground">
							You need to be logged in to leave a comment.
						</p>
					{:else}
						<h2 class="text-xl font-bold mb-4">Leave a comment</h2>
						<form
							{...postComment.enhance(({ submit }) => {
								submit();
								postComment.fields.comment.set("");
							})}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="comment">Comment</Label>
								<Textarea
									{...postComment.fields.comment.as("text")}
									id="comment"
									rows={4}
								/>
								{#each postComment.fields.comment.issues() ?? [] as issue}
									<p class="text-sm text-destructive">
										{issue.message}
									</p>
								{/each}
							</div>

							<input
								type="hidden"
								name="postId"
								value={post.id}
							/>

							<Button
								type="submit"
								disabled={!!postComment.pending}
							>
								{#if postComment.pending}
									Posting...
								{:else}
									Post comment
								{/if}
							</Button>
						</form>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>

	<div class="lg:w-1/3 space-y-4">
		<h2 class="text-xl font-bold">More Svelte</h2>
		<div class="space-y-2">
			{#each await getPosts() as post}
				<a
					href="/blog/{post.slug}"
					class="block border rounded-lg p-3 hover:bg-accent capitalize hover:underline"
				>
					{post.title}
				</a>
			{/each}
		</div>
	</div>
</div>
