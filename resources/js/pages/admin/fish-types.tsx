import { useState } from 'react';
import { Deferred, Form, Head, useForm } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PencilEdit01Icon,
    SortByDown01Icon,
    SortByUp01Icon,
    Sorting01Icon,
} from '@hugeicons/core-free-icons';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import FishTypeController from '@/actions/App/Http/Controllers/Admin/FishTypeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/fish-types';

type FishType = {
    id: number;
    name: string;
    is_active: boolean;
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
    if (sorted === 'asc')
        return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
    if (sorted === 'desc')
        return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
    return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

function FishTypesTable({
    fishTypes,
    onEdit,
}: {
    fishTypes: FishType[];
    onEdit: (fishType: FishType) => void;
}) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'name', desc: false },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState('');

    const columns: ColumnDef<FishType>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Name
                    <SortIcon sorted={column.getIsSorted()} />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.original.name}</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="size-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => onEdit(row.original)}
                                aria-label={`Edit ${row.original.name}`}
                            >
                                <HugeiconsIcon icon={PencilEdit01Icon} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edit name</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Status
                    <SortIcon sorted={column.getIsSorted()} />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge
                    variant={row.original.is_active ? 'outline' : 'secondary'}
                    className={cn(
                        row.original.is_active && 'border-green-200 bg-green-50 text-green-700',
                    )}
                >
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Form
                    {...FishTypeController.update.form(row.original)}
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <>
                            <input
                                type="hidden"
                                name="is_active"
                                value={row.original.is_active ? '0' : '1'}
                            />
                            <Button variant="ghost" size="sm" disabled={processing}>
                                {row.original.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                        </>
                    )}
                </Form>
            ),
        },
    ];

    const table = useReactTable({
        data: fishTypes,
        columns,
        state: { sorting, columnFilters, columnVisibility, globalFilter },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 15 } },
    });

    if (fishTypes.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>No fish types yet</EmptyTitle>
                    <EmptyDescription>
                        Add your first species using the form above.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} of {fishTypes.length} fish type
                    {fishTypes.length !== 1 ? 's' : ''}
                </span>
                <Input
                    placeholder="Search fish types..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-56"
                />
            </div>

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="group">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyTitle>No results</EmptyTitle>
                                            <EmptyDescription>
                                                No fish types match your search.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FishTypes({
    fishTypes,
    status,
}: {
    fishTypes?: FishType[];
    status?: string;
}) {
    const [editingFishType, setEditingFishType] = useState<FishType | null>(null);

    const { data, setData, patch, processing: editProcessing, errors, reset, clearErrors } = useForm({ name: '' });

    function openEdit(fishType: FishType) {
        setEditingFishType(fishType);
        setData('name', fishType.name);
    }

    function closeDialog() {
        setEditingFishType(null);
        reset();
        clearErrors();
    }

    function handleRename(e: React.FormEvent) {
        e.preventDefault();
        if (!editingFishType) return;

        patch(FishTypeController.update.url(editingFishType), {
            preserveScroll: true,
            onSuccess: () => closeDialog(),
        });
    }

    return (
        <>
            <Head title="Fish types" />

            <div className="space-y-6">
                <Heading title="Fish Types" description="Manage the species available for ordering." />

                {/* Add fish type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Fish Type</CardTitle>
                        <CardDescription>New fish types are active by default.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...FishTypeController.store.form()}
                            options={{ preserveScroll: true }}
                            className="flex items-end gap-3"
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Fish type name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="e.g. Snapper, Barramundi..."
                                            className="w-72"
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <Button disabled={processing}>
                                        {processing ? 'Adding...' : 'Add'}
                                    </Button>

                                    {(recentlySuccessful || status === 'fish-type-created') && (
                                        <p className="text-sm text-muted-foreground">Added.</p>
                                    )}
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                {/* All fish types */}
                <Deferred
                    data="fishTypes"
                    fallback={
                        <div className="overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-7 w-20" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    }
                >
                    <FishTypesTable fishTypes={fishTypes ?? []} onEdit={openEdit} />
                </Deferred>
            </div>

            <Dialog open={editingFishType !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Fish Type</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleRename}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog} disabled={editProcessing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                {editProcessing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

FishTypes.layout = {
    breadcrumbs: [{ title: 'Fish types', href: index() }],
};
