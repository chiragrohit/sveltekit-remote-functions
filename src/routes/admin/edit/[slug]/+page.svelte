<script lang="ts">
	import { getPost, removePost, updatePost } from "$lib/api/posts.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";

	let { params } = $props();

	const post = $derived(await getPost(params.slug));
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Update post</h1>

	<form {...updatePost.enhance(({ submit }) => submit())} class="space-y-6">
		<div class="space-y-2">
			<Label for="title">Title</Label>
			<Input
				{...updatePost.fields.title.as("text")}
				value={post.title}
				id="title"
			/>
			{#each updatePost.fields.title.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="slug">Slug</Label>
			<Input
				{...updatePost.fields.slug.as("text")}
				value={post.slug}
				id="slug"
			/>
			{#each updatePost.fields.slug.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="content">Content</Label>
			<Textarea
				{...updatePost.fields.content.as("text")}
				value={post.content}
				id="content"
				rows={10}
			/>
			{#each updatePost.fields.content.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<input {...updatePost.fields.id.as("hidden", post.id.toString())} />

		<div class="flex gap-4">
			<Button
				type="submit"
				disabled={!!updatePost.pending}
				class="flex-1"
			>
				{#if updatePost.pending}
					Updating...
				{:else}
					Update
				{/if}
			</Button>
			<Button
				{...removePost.buttonProps}
				disabled={!!removePost.pending}
				variant="destructive"
			>
				{#if removePost.pending}
					Deleting...
				{:else}
					Delete
				{/if}
			</Button>
		</div>
	</form>
</div>
