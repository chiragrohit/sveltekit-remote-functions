<script lang="ts">
	import { getUser, signout } from "$lib/api/auth.remote";
	import { Button } from "$lib/components/ui/button";

	const user = await getUser();
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-bold">Admin</h2>
	<p>Welcome, {user.name}!</p>
</div>
