<script lang="ts">
	import { getUser, updateName } from "$lib/api/auth.remote";
	import {
		getUserContents,
		deleteContent,
		bulkDeleteContents,
		bulkToggleContentVisibility,
		toggleContentVisibility,
	} from "$lib/api/content.remote";
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
	import { onMount } from "svelte";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table";
	import {
		getCoreRowModel,
		type ColumnDef,
		type Table as TanstackTable,
	} from "@tanstack/table-core";
	import {
		createSvelteTable,
		FlexRender,
	} from "$lib/components/ui/data-table";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { ContentTable } from "$lib/components"; // Import the new component

	let isEditing = $state(false);
	let name = $state("");
	const user = await getUser();
	name = user.name;

	// User content state
	let userContents = $state<any[]>([]);
	let filteredContents = $state<any[]>([]);
	let isLoadingContents = $state(false);
	let contentsError = $state<string | null>(null);
	let searchQuery = $state("");
	let visibilityFilter = $state("all");

	// Selection state - track selected content IDs
	let selectedContentIds = $state<Set<string>>(new Set());

	// Define options for visibility filter
	const visibilityOptions = [
		{ value: "all", label: "All Visibility" },
		{ value: "public", label: "Public" },
		{ value: "private", label: "Private" },
	];

	// Derived content for visibility trigger
	const visibilityTriggerContent = $derived(
		visibilityOptions.find((option) => option.value === visibilityFilter)
			?.label ?? "Visibility"
	);

	// Function to format date
	function formatDate(date: Date | string | null | undefined): string {
		if (!date) return "";
		const d = new Date(date);
		return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
	}

	// Define table columns
	const columns: ColumnDef<any>[] = [
		{
			accessorKey: "title",
			header: "Title",
		},
		{
			accessorKey: "publishedAt",
			header: "Date",
		},
		{
			accessorKey: "visibility",
			header: "Visibility",
		},
	];

	// Create table instance
	let table = $state<TanstackTable<any> | null>(null);

	$effect(() => {
		if (filteredContents.length > 0) {
			table = createSvelteTable({
				data: filteredContents,
				columns,
				getCoreRowModel: getCoreRowModel(),
			});
		}
	});

	// Filter contents based on search query and filters
	function filterContents() {
		let result = [...userContents];

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(content) =>
					content.title && content.title.toLowerCase().includes(query)
			);
		}

		// Apply visibility filter
		if (visibilityFilter !== "all") {
			result = result.filter(
				(content) => content.visibility === visibilityFilter
			);
		}

		filteredContents = result;
	}

	// Watch for changes in filters or userContents
	$effect(() => {
		filterContents();
	});

	// Function to fetch user's created content
	const fetchUserContents = async () => {
		isLoadingContents = true;
		contentsError = null;
		try {
			const response = await getUserContents({
				userId: user.id,
				limit: 50, // Fetch more items for the list
				offset: 0,
			});
			userContents = response.contents || [];
			filteredContents = [...userContents];
		} catch (err) {
			contentsError = "Failed to fetch your content";
			console.error("Error fetching user contents:", err);
		} finally {
			isLoadingContents = false;
		}
	};

	// Delete a single content item
	const deleteContentItem = async (contentId: string) => {
		if (!confirm("Are you sure you want to delete this content?")) return;

		try {
			await deleteContent({ contentId });
			// Update UI instantly without refresh
			userContents = userContents.filter(
				(content) => content.id !== contentId
			);
			filteredContents = filteredContents.filter(
				(content) => content.id !== contentId
			);
			// Remove from selection if it was selected
			selectedContentIds.delete(contentId);
			selectedContentIds = new Set(selectedContentIds); // Trigger reactivity
		} catch (err) {
			contentsError = "Failed to delete content";
			console.error("Error deleting content:", err);
		}
	};

	// Toggle visibility of a single content item
	const toggleContentItemVisibility = async (contentId: string) => {
		try {
			const response = await toggleContentVisibility({ contentId });
			// Update UI instantly without refresh
			userContents = userContents.map((content) =>
				content.id === contentId
					? { ...content, visibility: response.visibility }
					: content
			);
			filteredContents = filteredContents.map((content) =>
				content.id === contentId
					? { ...content, visibility: response.visibility }
					: content
			);
		} catch (err) {
			contentsError = "Failed to toggle content visibility";
			console.error("Error toggling content visibility:", err);
		}
	};

	// Bulk delete selected contents
	const bulkDeleteSelected = async () => {
		if (selectedContentIds.size === 0) {
			alert("Please select at least one content to delete");
			return;
		}

		if (
			!confirm(
				`Are you sure you want to delete ${selectedContentIds.size} content(s)?`
			)
		)
			return;

		try {
			const contentIds = Array.from(selectedContentIds);
			await bulkDeleteContents({ contentIds });
			// Update UI instantly without refresh
			userContents = userContents.filter(
				(content) => !contentIds.includes(content.id)
			);
			filteredContents = filteredContents.filter(
				(content) => !contentIds.includes(content.id)
			);
			// Clear selection
			selectedContentIds = new Set();
		} catch (err) {
			contentsError = "Failed to delete selected contents";
			console.error("Error deleting selected contents:", err);
		}
	};

	// Bulk toggle visibility of selected contents
	const bulkToggleSelectedVisibility = async (
		visibility: "public" | "private"
	) => {
		if (selectedContentIds.size === 0) {
			alert("Please select at least one content to update");
			return;
		}

		try {
			const contentIds = Array.from(selectedContentIds);
			await bulkToggleContentVisibility({ contentIds, visibility });
			// Update UI instantly without refresh
			userContents = userContents.map((content) =>
				contentIds.includes(content.id)
					? { ...content, visibility }
					: content
			);
			filteredContents = filteredContents.map((content) =>
				contentIds.includes(content.id)
					? { ...content, visibility }
					: content
			);
			// Clear selection
			selectedContentIds = new Set();
		} catch (err) {
			contentsError = `Failed to set selected contents to ${visibility}`;
			console.error("Error toggling selected contents visibility:", err);
		}
	};

	// Toggle selection of a content item
	function toggleContentSelection(contentId: string) {
		if (selectedContentIds.has(contentId)) {
			selectedContentIds.delete(contentId);
		} else {
			selectedContentIds.add(contentId);
		}
		selectedContentIds = new Set(selectedContentIds); // Trigger reactivity
	}

	// Toggle select all
	function toggleSelectAll() {
		if (
			selectedContentIds.size === filteredContents.length &&
			filteredContents.length > 0
		) {
			// Deselect all
			selectedContentIds = new Set();
		} else {
			// Select all
			selectedContentIds = new Set(
				filteredContents.map((content) => content.id)
			);
		}
	}

	// Fetch user contents when component mounts
	onMount(async () => {
		await fetchUserContents();
	});
</script>

<div class="space-y-6 mx-auto max-w-3xl p-6">
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
								alt="Profile"
								class="w-16 h-16 rounded-full object-cover"
							/>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- User's Content Section -->
		<Card class="col-span-1 md:col-span-2">
			<CardHeader>
				<CardTitle>Your Content</CardTitle>
			</CardHeader>
			<CardContent>
				<!-- Filter Controls -->
				<div class="flex flex-col md:flex-row gap-4 mb-4">
					<div class="flex-1">
						<Input
							type="text"
							placeholder="Search content..."
							bind:value={searchQuery}
							class="w-full"
						/>
					</div>
					<Select.Select
						type="single"
						bind:value={visibilityFilter}
						onValueChange={(value: string) =>
							(visibilityFilter = value)}
					>
						<Select.SelectTrigger class="w-[180px]">
							{visibilityTriggerContent}
						</Select.SelectTrigger>
						<Select.SelectContent>
							<Select.SelectGroup>
								<Select.SelectLabel
									>Visibility</Select.SelectLabel
								>
								{#each visibilityOptions as option (option.value)}
									<Select.SelectItem
										value={option.value}
										label={option.label}
									>
										{option.label}
									</Select.SelectItem>
								{/each}
							</Select.SelectGroup>
						</Select.SelectContent>
					</Select.Select>
				</div>

				<!-- Bulk Action Buttons -->
				{#if selectedContentIds.size > 0}
					<div class="flex gap-2 mb-4">
						<Button
							variant="destructive"
							size="sm"
							onclick={bulkDeleteSelected}
						>
							Delete Selected ({selectedContentIds.size})
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() =>
								bulkToggleSelectedVisibility("public")}
						>
							Set Public
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() =>
								bulkToggleSelectedVisibility("private")}
						>
							Set Private
						</Button>
					</div>
				{/if}

				{#if isLoadingContents}
					<div class="flex justify-center items-center h-32">
						<div
							class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
						></div>
					</div>
				{:else if contentsError}
					<div
						class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
						role="alert"
					>
						<span class="block sm:inline">{contentsError}</span>
					</div>
				{:else if filteredContents.length > 0 && table}
					<ContentTable
						{table}
						bind:selectedContentIds
						onToggleSelection={toggleContentSelection}
						onSelectAll={toggleSelectAll}
						onDelete={deleteContentItem}
						onToggleVisibility={toggleContentItemVisibility}
						{formatDate}
					/>
				{:else}
					<div class="text-center py-8">
						<p class="text-gray-500">
							You haven't created any content yet
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
