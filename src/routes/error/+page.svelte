<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { goto } from "$app/navigation";

	function goHome() {
		goto("/");
	}
</script>

<div class="flex min-h-[calc(100vh-8rem)] items-center justify-center">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-3xl font-bold text-center">404</CardTitle>
			<CardDescription class="text-center">
				Page Not Found
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="text-center text-muted-foreground">
				<p>Oops! The page you're looking for doesn't exist.</p>
				<p class="mt-2">It might have been moved or deleted.</p>
			</div>

			<div class="flex justify-center pt-4">
				<Button onclick={goHome}>Go Back Home</Button>
			</div>
		</CardContent>
	</Card>
</div>
