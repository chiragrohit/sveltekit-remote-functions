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

	let { params } = $props();

	const post = $derived(await getPost(params.slug));
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
	<div class="lg:col-span-2 space-y-6">
		<Card>
			<CardHeader>
				<CardTitle class="text-3xl">{post.title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="prose max-w-none">{@html post.content}</div>
			</CardContent>
		</Card>

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
					<h2 class="text-xl font-bold mb-4">Leave a comment</h2>

					<form
						{...postComment.enhance(({ submit }) => {
							submit();
							postComment.fields.comment.set("");
						})}
						class="space-y-4"
					>
						<div class="space-y-2">
							<Label for="author">Name</Label>
							<Input
								{...postComment.fields.author.as("text")}
								value="Anonymous"
								id="author"
							/>
							{#each postComment.fields.author.issues() ?? [] as issue}
								<p class="text-sm text-destructive">
									{issue.message}
								</p>
							{/each}
						</div>

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
							{...postComment.fields.postId.as(
								"hidden",
								post.id.toString()
							)}
						/>

						<Button type="submit" disabled={!!postComment.pending}>
							{#if postComment.pending}
								Posting...
							{:else}
								Post comment
							{/if}
						</Button>
					</form>
				</div>
			</CardContent>
		</Card>
	</div>

	<div class="space-y-4">
		<h2 class="text-xl font-bold">More Svelte</h2>
		<div class="space-y-2">
			{#each await getPosts() as post}
				<div class="border rounded-lg p-3 hover:bg-accent">
					<a href="/{post.slug}" class="capitalize hover:underline"
						>{post.title}</a
					>
				</div>
			{/each}
		</div>
	</div>
</div>
