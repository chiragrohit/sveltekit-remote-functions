<script lang="ts">
	import { getUser, updateName } from "$lib/api/auth.remote";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import {
		Card,
		CardContent,
		CardFooter,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";

	let isEditing = $state(false);
	let name = $state("");
	const user = await getUser();
	name = user.name;
</script>

<div class="space-y-6 mx-auto max-w-3xl">
	<div
		class="flex justify-between items-start md:items-center flex-col md:flex-row gap-4"
	>
		<div>
			<h1 class="text-3xl font-bold">Profile</h1>
			<p class="text-muted-foreground">Manage your account settings</p>
		</div>
		{#if !isEditing}
			<Button onclick={() => (isEditing = true)}>Edit Profile</Button>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="col-span-1 md:col-span-2">
			<CardHeader>
				<CardTitle>Personal Information</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="space-y-2">
					<Label for="name">Full Name</Label>
					{#if isEditing}
						<form {...updateName} class="space-y-4">
							<div class="space-y-2">
								<Input
									{...updateName.fields.name.as("text")}
									id="name"
									bind:value={name}
									placeholder="Enter your full name"
									class="max-w-md"
								/>
								{#each updateName.fields.name.issues() ?? [] as issue}
									<p class="text-sm text-destructive">
										{issue.message}
									</p>
								{/each}
							</div>
							<div class="flex gap-3">
								<Button
									type="submit"
									disabled={!!updateName.pending}
								>
									{#if updateName.pending}
										Saving...
									{:else}
										Save Changes
									{/if}
								</Button>
								<Button
									type="button"
									variant="outline"
									onclick={() => {
										isEditing = false;
										name = user.name;
									}}
								>
									Cancel
								</Button>
							</div>
						</form>
					{:else}
						<div class="flex items-center gap-3">
							<p class="text-lg">{user.name}</p>
						</div>
					{/if}
				</div>

				<div class="space-y-2">
					<Label>Email Address</Label>
					<div class="flex items-center gap-3">
						<p>{user.email}</p>
						{#if user.emailVerified}
							<Badge variant="secondary">Verified</Badge>
						{:else}
							<Badge variant="destructive">Unverified</Badge>
						{/if}
					</div>
				</div>

				{#if user.image}
					<div class="space-y-2">
						<Label>Profile Image</Label>
						<div class="flex items-center gap-3">
							<img
								src={user.image}
								alt="Profile image"
								class="w-16 h-16 rounded-full object-cover"
							/>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
