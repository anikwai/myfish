import { Transition } from '@headlessui/react';
import {
    SortByDown01Icon,
    SortByUp01Icon,
    Sorting01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Form, Head } from '@inertiajs/react';
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import InventoryController from '@/actions/App/Http/Controllers/Admin/InventoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { kgToLbs } from '@/lib/pricing';
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

type LastAdjustment = {
    user_name: string | null;
    created_at: string;
} | null;

// ── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
    if (sorted === 'asc') {
        return (
            <HugeiconsIcon icon={SortByDown01Icon} size={14} className="ml-1" />
        );
    }

    if (sorted === 'desc') {
        return (
            <HugeiconsIcon icon={SortByUp01Icon} size={14} className="ml-1" />
        );
    }

    return <HugeiconsIcon icon={Sorting01Icon} size={14} className="ml-1" />;
}

// ── Datatable columns ────────────────────────────────────────────────────────

const columns: ColumnDef<Adjustment>[] = [
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Date <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {new Date(row.original.created_at).toLocaleString('en-AU', {
                    hour12: false,
                })}
            </span>
        ),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Type <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="capitalize">{row.original.type}</span>
        ),
    },
    {
        accessorKey: 'delta_kg',
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="w-full justify-end"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Delta (kg) <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ row }) => (
            <span
                className={cn(
                    'block text-right font-mono',
                    Number(row.original.delta_kg) >= 0
                        ? 'text-green-600'
                        : 'text-red-600',
                )}
            >
                {Number(row.original.delta_kg) > 0 ? '+' : ''}
                {Number(row.original.delta_kg).toFixed(3)}
            </span>
        ),
        sortingFn: (a, b) =>
            Number(a.original.delta_kg) - Number(b.original.delta_kg),
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
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                By <SortIcon sorted={column.getIsSorted()} />
            </Button>
        ),
        cell: ({ getValue }) => (
            <span className="text-muted-foreground">
                {getValue() as string}
            </span>
        ),
    },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Inventory({
    stock_kg,
    stock_pounds,
    kg_to_lbs_rate,
    adjustments,
    last_adjustment,
    status,
}: {
    stock_kg: number;
    stock_pounds: number;
    kg_to_lbs_rate: number;
    adjustments: Adjustment[];
    last_adjustment: LastAdjustment;
    status?: string;
}) {
    const [showForm, setShowForm] = useState(false);
    const [deltaValue, setDeltaValue] = useState('');

    // Datatable state
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'created_at', desc: true },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
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

    // Live preview calculation
    const parsedDelta = parseFloat(deltaValue);
    const newKg =
        !isNaN(parsedDelta) && deltaValue !== ''
            ? stock_kg + parsedDelta
            : null;
    const newPounds = newKg !== null ? kgToLbs(newKg, kg_to_lbs_rate) : null;

    const PRESETS = [10, 25, 50, -10, -25];

    return (
        <>
            <Head title="Inventory" />

            <div className="space-y-8">
                <Heading title="Inventory" />

                {/* Hero — current stock */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Current stock
                                </p>
                                <p className="text-4xl font-bold tracking-tight">
                                    {Number(stock_kg).toFixed(3)} kg
                                </p>
                                <p className="mt-1 text-lg text-muted-foreground">
                                    {Number(stock_pounds).toFixed(3)} lbs
                                </p>
                            </div>
                            {last_adjustment && (
                                <p className="text-right text-sm text-muted-foreground">
                                    Last adjusted{' '}
                                    {new Date(
                                        last_adjustment.created_at,
                                    ).toLocaleString('en-AU', {
                                        hour12: false,
                                    })}
                                    {last_adjustment.user_name && (
                                        <>
                                            {' '}
                                            by{' '}
                                            <span className="font-medium">
                                                {last_adjustment.user_name}
                                            </span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Record adjustment toggle */}
                <div>
                    {!showForm ? (
                        <Button onClick={() => setShowForm(true)}>
                            + Record Adjustment
                        </Button>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Record Adjustment</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowForm(false);
                                        setDeltaValue('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </CardHeader>
                            <Separator />
                            <CardContent className="pt-6">
                                <Form
                                    {...InventoryController.adjust.form()}
                                    options={{ preserveScroll: true }}
                                    className="space-y-4"
                                >
                                    {({
                                        processing,
                                        recentlySuccessful,
                                        errors,
                                    }) => (
                                        <>
                                            {/* Presets */}
                                            <div className="flex flex-wrap gap-2">
                                                {PRESETS.map((preset) => (
                                                    <Button
                                                        key={preset}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeltaValue(
                                                                String(preset),
                                                            )
                                                        }
                                                        className={cn(
                                                            preset < 0 &&
                                                                'text-red-600',
                                                        )}
                                                    >
                                                        {preset > 0
                                                            ? `+${preset}`
                                                            : preset}{' '}
                                                        kg
                                                    </Button>
                                                ))}
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="delta_kg">
                                                        Adjustment (kg)
                                                    </Label>
                                                    <Input
                                                        id="delta_kg"
                                                        type="number"
                                                        step="0.001"
                                                        name="delta_kg"
                                                        placeholder="e.g. 50 or -5"
                                                        value={deltaValue}
                                                        onChange={(e) =>
                                                            setDeltaValue(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.delta_kg
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="reason">
                                                        Reason
                                                    </Label>
                                                    <Input
                                                        id="reason"
                                                        name="reason"
                                                        placeholder="e.g. New stock delivery"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.reason}
                                                    />
                                                </div>
                                            </div>

                                            {/* Live preview */}
                                            {newKg !== null && (
                                                <Alert
                                                    className={cn(
                                                        newKg < 0
                                                            ? 'border-red-200 bg-red-50 text-red-700'
                                                            : 'border-green-200 bg-green-50 text-green-700',
                                                    )}
                                                >
                                                    New total:{' '}
                                                    <span className="font-semibold">
                                                        {newKg.toFixed(3)} kg
                                                    </span>
                                                    {' / '}
                                                    <span className="font-semibold">
                                                        {newPounds!.toFixed(3)}{' '}
                                                        lbs
                                                    </span>
                                                    {newKg < 0 && (
                                                        <span className="ml-2 font-medium">
                                                            ⚠ Stock cannot go
                                                            below 0
                                                        </span>
                                                    )}
                                                </Alert>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <Button
                                                    disabled={
                                                        processing ||
                                                        (newKg !== null &&
                                                            newKg < 0)
                                                    }
                                                >
                                                    {processing
                                                        ? 'Saving...'
                                                        : 'Apply adjustment'}
                                                </Button>

                                                <Transition
                                                    show={
                                                        recentlySuccessful ||
                                                        status ===
                                                            'inventory-updated'
                                                    }
                                                    enter="transition ease-in-out"
                                                    enterFrom="opacity-0"
                                                    leave="transition ease-in-out"
                                                    leaveTo="opacity-0"
                                                >
                                                    <p className="text-sm text-muted-foreground">
                                                        Saved.
                                                    </p>
                                                </Transition>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Adjustment history */}
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
                                                          header.column
                                                              .columnDef.header,
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
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                                    <EmptyTitle>
                                                        No adjustments
                                                    </EmptyTitle>
                                                    <EmptyDescription>
                                                        No stock changes match
                                                        your search.
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
                                {table.getFilteredRowModel().rows.length}{' '}
                                adjustment
                                {table.getFilteredRowModel().rows.length !== 1
                                    ? 's'
                                    : ''}
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
                                    Page{' '}
                                    {table.getState().pagination.pageIndex + 1}{' '}
                                    of {table.getPageCount()}
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
