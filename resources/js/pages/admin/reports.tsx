import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Label,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import ReportingController from '@/actions/App/Http/Controllers/Admin/ReportingController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { index } from '@/routes/admin/reports';

type FishTypeStat = {
    name: string;
    order_count: number;
    total_kg: number;
};

type StockEntry = {
    delta_kg: string;
    reason: string | null;
    type: string;
    created_at: string;
};

type Period = 'today' | 'week' | 'month';

// --- Chart configs ---

const revenueConfig: ChartConfig = {
    fish: { label: 'Fish sales', color: 'var(--chart-1)' },
    filleting: { label: 'Filleting fees', color: 'var(--chart-2)' },
    delivery: { label: 'Delivery fees', color: 'var(--chart-3)' },
};

const fishTypesConfig: ChartConfig = {
    order_count: { label: 'Orders', color: 'var(--chart-1)' },
};

const stockConfig: ChartConfig = {
    delta_kg: { label: 'Delta (kg)', color: 'var(--chart-1)' },
};

// --- Datatable setup ---

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
    if (sorted === 'asc') {
        return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
    }
    if (sorted === 'desc') {
        return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
    }
    return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

const stockColumns: ColumnDef<StockEntry>[] = [
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
];

export default function Reports({
    period,
    orderCount,
    totalRevenue,
    filletingRevenue,
    deliveryRevenue,
    totalKg,
    totalPounds,
    topFishTypes,
    stockHistory,
    kgToLbsRate,
}: {
    period: Period;
    orderCount: number;
    totalRevenue: number;
    filletingRevenue: number;
    deliveryRevenue: number;
    totalKg: number;
    totalPounds: number;
    topFishTypes: FishTypeStat[];
    stockHistory: StockEntry[];
    kgToLbsRate: number;
}) {
    const fishRevenue = totalRevenue - filletingRevenue - deliveryRevenue;

    // Datatable state
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data: stockHistory,
        columns: stockColumns,
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

    function setPeriod(p: Period) {
        router.get(ReportingController.index.url({ query: { period: p } }));
    }

    const periods: { value: Period; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This week' },
        { value: 'month', label: 'This month' },
    ];

    // Chart data
    const revenueData = [
        { name: 'fish', value: fishRevenue, fill: 'var(--color-fish)' },
        { name: 'filleting', value: filletingRevenue, fill: 'var(--color-filleting)' },
        { name: 'delivery', value: deliveryRevenue, fill: 'var(--color-delivery)' },
    ].filter((d) => d.value > 0);

    const stockChartData = [...stockHistory]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((entry) => ({
            date: new Date(entry.created_at).toLocaleDateString('en-AU'),
            delta_kg: Number(entry.delta_kg),
        }));

    return (
        <>
            <Head title="Reports" />

            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <Heading title="Reports" description="Revenue, orders, and weight summaries." />

                    <ToggleGroup
                        type="single"
                        value={period}
                        onValueChange={(v) => v && setPeriod(v as Period)}
                    >
                        {periods.map((p) => (
                            <ToggleGroupItem key={p.value} value={p.value}>
                                {p.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Orders" value={String(orderCount)} />
                    <StatCard label="Total revenue" value={`$${totalRevenue.toFixed(2)} SBD`} />
                    <StatCard label="Weight sold" value={`${totalKg.toFixed(3)} kg`} sub={`${totalPounds.toFixed(3)} lbs`} />
                    <StatCard label="Fish revenue" value={`$${fishRevenue.toFixed(2)} SBD`} sub="excl. fees" />
                </div>

                {/* Revenue breakdown — donut chart */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Revenue breakdown</CardTitle>
                            <CardDescription>Fish sales vs fees</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {revenueData.length === 0 ? (
                                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                    No revenue for this period.
                                </div>
                            ) : (
                                <ChartContainer config={revenueConfig} className="mx-auto aspect-square max-h-80">
                                    <PieChart accessibilityLayer>
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    hideLabel
                                                    formatter={(value) =>
                                                        `$${Number(value).toFixed(2)} SBD`
                                                    }
                                                />
                                            }
                                        />
                                        <Pie
                                            data={revenueData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius="50%"
                                            outerRadius="75%"
                                            strokeWidth={5}
                                        >
                                            {revenueData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="fill-foreground text-2xl font-bold"
                                                                >
                                                                    ${totalRevenue.toFixed(0)}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 22}
                                                                    className="fill-muted-foreground text-xs"
                                                                >
                                                                    SBD
                                                                </tspan>
                                                            </text>
                                                        );
                                                    }
                                                }}
                                            />
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                    </PieChart>
                                </ChartContainer>
                            )}
                            <Separator className="my-4" />
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fish sales</span>
                                    <span className="font-mono">${fishRevenue.toFixed(2)} SBD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Filleting fees</span>
                                    <span className="font-mono">${filletingRevenue.toFixed(2)} SBD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Delivery fees</span>
                                    <span className="font-mono">${deliveryRevenue.toFixed(2)} SBD</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span className="font-mono">${totalRevenue.toFixed(2)} SBD</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top fish types — horizontal bar chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top fish types</CardTitle>
                            <CardDescription>By number of orders</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topFishTypes.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyTitle>No data</EmptyTitle>
                                        <EmptyDescription>No data for this period.</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <ChartContainer config={fishTypesConfig} className="max-h-64 w-full">
                                    <BarChart
                                        accessibilityLayer
                                        data={topFishTypes}
                                        layout="vertical"
                                        margin={{ left: 8, right: 16 }}
                                    >
                                        <CartesianGrid horizontal={false} />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            width={80}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <XAxis
                                            type="number"
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar
                                            dataKey="order_count"
                                            fill="var(--color-order_count)"
                                            radius={4}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stock history — area chart + datatable */}
                <div className="space-y-3">
                    <Heading variant="small" title="Stock history" description="Inventory changes for this period." />

                    {stockHistory.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No stock changes</EmptyTitle>
                                <EmptyDescription>No stock changes recorded.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Stock delta over time</CardTitle>
                                    <CardDescription>kg added or removed per adjustment</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={stockConfig} className="max-h-52 w-full">
                                        <AreaChart accessibilityLayer data={stockChartData} margin={{ left: 8, right: 8 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v) => v}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fontSize: 11 }}
                                                tickFormatter={(v) => `${v}kg`}
                                            />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        formatter={(value) =>
                                                            `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(3)} kg`
                                                        }
                                                    />
                                                }
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="delta_kg"
                                                fill="var(--color-delta_kg)"
                                                fillOpacity={0.2}
                                                stroke="var(--color-delta_kg)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-muted-foreground">All changes</span>
                                <Input
                                    placeholder="Search reason or type..."
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
                                            table.getRowModel().rows.map((row, i) => (
                                                <TableRow key={i}>
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
                                                <TableCell colSpan={stockColumns.length}>
                                                    <Empty>
                                                        <EmptyHeader>
                                                            <EmptyTitle>No stock changes</EmptyTitle>
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
                                        {table.getFilteredRowModel().rows.length} change
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
            {sub && (
                <CardContent>
                    <p className="text-sm text-muted-foreground">{sub}</p>
                </CardContent>
            )}
        </Card>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: index() }],
};
