<script lang="ts">
	import { signup } from "$lib/api/auth.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
</script>

<div class="max-w-md mx-auto space-y-6">
	<h1 class="text-2xl font-bold">Sign up</h1>

	<form {...signup} class="space-y-4">
		<div class="space-y-2">
			<Label for="name">Username</Label>
			<Input {...signup.fields.name.as("text")} id="name" />
			{#each signup.fields.name.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input {...signup.fields.email.as("text")} id="email" />
			{#each signup.fields.email.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="password">Password</Label>
			<Input {...signup.fields.password.as("password")} id="password" />
			{#each signup.fields.password.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<Button type="submit" class="w-full">Sign up</Button>
	</form>
</div>
