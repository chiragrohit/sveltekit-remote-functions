<script lang="ts">
	import { createPost } from "$lib/api/posts.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Create new post</h1>

	<form {...createPost} class="space-y-6">
		<div class="space-y-2">
			<Label for="title">Title</Label>
			<Input {...createPost.fields.title.as("text")} id="title" />
			{#each createPost.fields.title.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="slug">Slug</Label>
			<Input {...createPost.fields.slug.as("text")} id="slug" />
			{#each createPost.fields.slug.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="content">Content</Label>
			<Textarea
				{...createPost.fields.content.as("text")}
				id="content"
				rows={10}
			/>
			{#each createPost.fields.content.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<Button type="submit" class="w-full" disabled={!!createPost.pending}>
			{#if createPost.pending}
				Publishing...
			{:else}
				Publish
			{/if}
		</Button>
	</form>
</div>
