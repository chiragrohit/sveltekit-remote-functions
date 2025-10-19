<script lang="ts">
	import { login } from "$lib/api/auth.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
</script>

<div class="max-w-md mx-auto space-y-6">
	<h1 class="text-2xl font-bold">Log in</h1>

	<form {...login} class="space-y-4">
		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input {...login.fields.email.as("email")} id="email" />
			{#each login.fields.email.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<div class="space-y-2">
			<Label for="password">Password</Label>
			<Input {...login.fields.password.as("password")} id="password" />
			{#each login.fields.password.issues() ?? [] as issue}
				<p class="text-sm text-destructive">{issue.message}</p>
			{/each}
		</div>

		<p class="text-sm text-muted-foreground">
			Don't have an account?
			<a href="/auth/signup" class="text-primary hover:underline"
				>Sign up</a
			>
		</p>

		<Button type="submit" class="w-full">Login</Button>
	</form>
</div>
