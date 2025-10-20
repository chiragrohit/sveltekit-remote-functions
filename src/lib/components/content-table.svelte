<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { FlexRender } from "$lib/components/ui/data-table";
	import type { Table as TanstackTable } from "@tanstack/table-core";

	// Use Svelte 5 syntax for bindable props
	let {
		table,
		selectedContentIds = $bindable<Set<string>>(new Set()),
		onToggleSelection,
		onSelectAll,
		onDelete,
		onToggleVisibility,
		formatDate,
	} = $props();

	$effect(() => {
		// This ensures the component reacts to changes in the table data
	});
</script>

{#if table}
	<div class="rounded-md border">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="w-12">
						<Checkbox
							checked={selectedContentIds.size ===
								table.getRowModel().rows.length &&
								table.getRowModel().rows.length > 0}
							onCheckedChange={(value) => onSelectAll()}
							aria-label="Select all"
						/>
					</TableHead>
					{#each table.getHeaderGroups() as headerGroup}
						{#each headerGroup.headers as header}
							<TableHead>
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							</TableHead>
						{/each}
					{/each}
					<TableHead class="w-16">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each table.getRowModel().rows as row}
					<TableRow>
						<TableCell>
							<Checkbox
								checked={selectedContentIds.has(
									row.original.id
								)}
								onCheckedChange={() =>
									onToggleSelection(row.original.id)}
								aria-label="Select row"
							/>
						</TableCell>
						{#each row.getVisibleCells() as cell}
							<TableCell>
								{#if cell.column.id === "title"}
									<a
										href={`/dashboard/article/${row.original.id}`}
										class="font-medium hover:underline"
									>
										{row.getValue("title") || "Untitled"}
									</a>
								{:else if cell.column.id === "publishedAt"}
									{formatDate(row.getValue("publishedAt"))}
								{:else if cell.column.id === "visibility"}
									<Button
										variant={row.getValue("visibility") ===
										"private"
											? "outline"
											: "secondary"}
										size="sm"
										onclick={() =>
											onToggleVisibility(row.original.id)}
										class="h-6 px-2 text-xs"
									>
										{row.getValue("visibility") ===
										"private"
											? "Private"
											: "Public"}
									</Button>
								{/if}
							</TableCell>
						{/each}
						<TableCell class="text-right">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onDelete(row.original.id)}
								class="h-8 w-8 p-0 text-destructive hover:text-destructive"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="lucide lucide-trash-2"
								>
									<path d="M3 6h18" />
									<path
										d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
									/>
									<path
										d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
									/>
									<line x1="10" x2="10" y1="11" y2="17" />
									<line x1="14" x2="14" y1="11" y2="17" />
								</svg>
							</Button>
						</TableCell>
					</TableRow>
				{:else}
					<TableRow>
						<TableCell
							colspan={table.getAllColumns().length + 1}
							class="h-24 text-center"
						>
							No results.
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{/if}
