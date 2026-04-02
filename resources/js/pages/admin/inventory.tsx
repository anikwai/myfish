import { useState } from 'react';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
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
import { HugeiconsIcon } from '@hugeicons/react';
import { SortByDown01Icon, SortByUp01Icon, Sorting01Icon } from '@hugeicons/core-free-icons';
import InventoryController from '@/actions/App/Http/Controllers/Admin/InventoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/inventory';

type Adjustment = {
    id: number;
    type: string;
    delta_kg: string;
    reason: string | null;
    created_at: string;
    user: { id: number; name: string };
};

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
    if (sorted === 'asc') {
        return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
    }
    if (sorted === 'desc') {
        return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
    }
    return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

const columns: ColumnDef<Adjustment>[] = [
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Date
                <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {new Date(row.original.created_at).toLocaleString('en-AU', { hour12: false })}
            </span>
        ),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Type
                <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
    },
    {
        accessorKey: 'delta_kg',
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="w-full justify-end"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Delta (kg)
                <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => (
            <span
                className={cn(
                    'block text-right font-mono',
                    Number(row.original.delta_kg) >= 0 ? 'text-green-600' : 'text-red-600',
                )}
            >
                {Number(row.original.delta_kg) > 0 ? '+' : ''}
                {Number(row.original.delta_kg).toFixed(3)}
            </span>
        ),
        sortingFn: (a, b) => Number(a.original.delta_kg) - Number(b.original.delta_kg),
    },
    {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason ?? '—',
    },
    {
        id: 'user',
        accessorFn: (row) => row.user.name,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                By
                <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ getValue }) => (
            <span className="text-muted-foreground">{getValue() as string}</span>
        ),
    },
];

export default function Inventory({
    stock_kg,
    stock_pounds,
    adjustments,
    status,
}: {
    stock_kg: number;
    stock_pounds: number;
    adjustments: Adjustment[];
    status?: string;
}) {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data: adjustments,
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
        initialState: { pagination: { pageSize: 20 } },
    });

    return (
        <>
            <Head title="Inventory" />

            <div className="space-y-8">
                <Heading title="Inventory" />

                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Current stock</CardDescription>
                            <CardTitle className="text-2xl">
                                {Number(stock_kg).toFixed(3)} kg
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {Number(stock_pounds).toFixed(3)} lbs
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Heading
                        variant="small"
                        title="Manual adjustment"
                        description="Enter a positive value to add stock, negative to reduce."
                    />

                    <Form
                        {...InventoryController.adjust.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-4"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="delta_kg">Adjustment (kg)</Label>
                                    <Input
                                        id="delta_kg"
                                        type="number"
                                        step="0.001"
                                        name="delta_kg"
                                        placeholder="e.g. 50 or -5"
                                        required
                                    />
                                    <InputError message={errors.delta_kg} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Input
                                        id="reason"
                                        name="reason"
                                        placeholder="e.g. New stock delivery"
                                        required
                                    />
                                    <InputError message={errors.reason} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Apply adjustment</Button>

                                    <Transition
                                        show={
                                            recentlySuccessful ||
                                            status === 'inventory-updated'
                                        }
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <Heading
                            variant="small"
                            title="Adjustment history"
                            description="Last 50 stock changes."
                        />
                        <Input
                            placeholder="Search reason or user..."
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
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <Empty>
                                                <EmptyHeader>
                                                    <EmptyTitle>No adjustments</EmptyTitle>
                                                    <EmptyDescription>
                                                        No stock changes match your search.
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
                                {table.getFilteredRowModel().rows.length} adjustment
                                {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
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
                                <span>
                                    Page {table.getState().pagination.pageIndex + 1} of{' '}
                                    {table.getPageCount()}
                                </span>
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
            </div>
        </>
    );
}

Inventory.layout = {
    breadcrumbs: [{ title: 'Inventory', href: index() }],
};
