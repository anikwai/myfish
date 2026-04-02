import { Head, router } from '@inertiajs/react';
import ReportingController from '@/actions/App/Http/Controllers/Admin/ReportingController';
import Heading from '@/components/heading';
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

    function setPeriod(p: Period) {
        router.get(ReportingController.index.url({ period: p }));
    }

    const periods: { value: Period; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This week' },
        { value: 'month', label: 'This month' },
    ];

    return (
        <>
            <Head title="Reports" />

            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <Heading title="Reports" description="Revenue, orders, and weight summaries." />

                    <div className="flex rounded-lg border overflow-hidden text-sm">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-4 py-2 transition-colors ${period === p.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Orders" value={String(orderCount)} />
                    <StatCard label="Total revenue" value={`$${totalRevenue.toFixed(2)} SBD`} />
                    <StatCard label="Weight sold" value={`${totalKg.toFixed(3)} kg`} sub={`${totalPounds.toFixed(3)} lbs`} />
                    <StatCard label="Fish revenue" value={`$${fishRevenue.toFixed(2)} SBD`} sub={`excl. fees`} />
                </div>

                {/* Fee breakdown */}
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                    <p className="font-medium">Revenue breakdown</p>
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
                    <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Total</span>
                        <span className="font-mono">${totalRevenue.toFixed(2)} SBD</span>
                    </div>
                </div>

                {/* Top fish types */}
                <div className="space-y-3">
                    <Heading variant="small" title="Top fish types" description="By number of orders." />

                    {topFishTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No data for this period.</p>
                    ) : (
                        <div className="rounded-lg border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Fish type</th>
                                        <th className="px-4 py-2 text-right font-medium">Orders</th>
                                        <th className="px-4 py-2 text-right font-medium">Total (kg)</th>
                                        <th className="px-4 py-2 text-right font-medium">Total (lbs)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topFishTypes.map((ft) => (
                                        <tr key={ft.name} className="border-b last:border-0">
                                            <td className="px-4 py-2">{ft.name}</td>
                                            <td className="px-4 py-2 text-right font-mono">{ft.order_count}</td>
                                            <td className="px-4 py-2 text-right font-mono">{ft.total_kg.toFixed(3)}</td>
                                            <td className="px-4 py-2 text-right font-mono">{(ft.total_kg * kgToLbsRate).toFixed(3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stock history */}
                <div className="space-y-3">
                    <Heading variant="small" title="Stock history" description="Last 30 inventory changes." />

                    {stockHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No stock changes recorded.</p>
                    ) : (
                        <div className="rounded-lg border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Date</th>
                                        <th className="px-4 py-2 text-left font-medium">Type</th>
                                        <th className="px-4 py-2 text-right font-medium">Delta (kg)</th>
                                        <th className="px-4 py-2 text-left font-medium">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockHistory.map((entry, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 capitalize">{entry.type}</td>
                                            <td className={`px-4 py-2 text-right font-mono ${Number(entry.delta_kg) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {Number(entry.delta_kg) > 0 ? '+' : ''}{Number(entry.delta_kg).toFixed(3)}
                                            </td>
                                            <td className="px-4 py-2">{entry.reason ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
        </div>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: index() }],
};
