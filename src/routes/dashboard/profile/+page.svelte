<script lang="ts">
	import { getUser, updateName } from "$lib/api/auth.remote";
	import { getUserContents } from "$lib/api/content.remote";
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

	// Fetch user contents when component mounts
	onMount(async () => {
		await fetchUserContents();
	});
</script>

<div class="space-y-6 mx-auto max-w-3xl mt-6">
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
					<div class="rounded-md border">
						<Table>
							<TableHeader>
								{#each table.getHeaderGroups() as headerGroup}
									<TableRow>
										{#each headerGroup.headers as header}
											<TableHead>
												<FlexRender
													content={header.column
														.columnDef.header}
													context={header.getContext()}
												/>
											</TableHead>
										{/each}
									</TableRow>
								{/each}
							</TableHeader>
							<TableBody>
								{#each table.getRowModel().rows as row}
									<TableRow>
										{#each row.getVisibleCells() as cell}
											<TableCell>
												{#if cell.column.id === "title"}
													<a
														href={`/dashboard/article/${row.original.id}`}
														class="font-medium hover:underline"
													>
														{row.getValue(
															"title"
														) || "Untitled"}
													</a>
												{:else if cell.column.id === "publishedAt"}
													{formatDate(
														row.getValue(
															"publishedAt"
														)
													)}
												{:else if cell.column.id === "visibility"}
													{#if row.getValue("visibility") === "private"}
														<Badge variant="outline"
															>Private</Badge
														>
													{:else}
														<Badge
															variant="secondary"
															>Public</Badge
														>
													{/if}
												{/if}
											</TableCell>
										{/each}
									</TableRow>
								{:else}
									<TableRow>
										<TableCell
											colspan={columns.length}
											class="h-24 text-center"
										>
											No results.
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
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
