import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import InventoryController from '@/actions/App/Http/Controllers/Admin/InventoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/inventory';

type Adjustment = {
    id: number;
    type: string;
    delta_kg: string;
    reason: string | null;
    created_at: string;
    user: { id: number; name: string };
};

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
    return (
        <>
            <Head title="Inventory" />

            <h1 className="sr-only">Inventory</h1>

            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">
                            Current stock
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {Number(stock_kg).toFixed(3)} kg
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {Number(stock_pounds).toFixed(3)} lbs
                        </p>
                    </div>
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
                                    <Label htmlFor="delta_kg">
                                        Adjustment (kg)
                                    </Label>
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
                                    <Button disabled={processing}>
                                        Apply adjustment
                                    </Button>

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
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="space-y-4">
                    <Heading
                        variant="small"
                        title="Adjustment history"
                        description="Last 50 stock changes."
                    />

                    {adjustments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No adjustments yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Date
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Type
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Delta (kg)
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Reason
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustments.map((adj) => (
                                        <tr
                                            key={adj.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {new Date(
                                                    adj.created_at,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 capitalize">
                                                {adj.type}
                                            </td>
                                            <td
                                                className={`px-4 py-2 text-right font-mono ${Number(adj.delta_kg) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {Number(adj.delta_kg) > 0
                                                    ? '+'
                                                    : ''}
                                                {Number(adj.delta_kg).toFixed(
                                                    3,
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {adj.reason ?? '—'}
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {adj.user.name}
                                            </td>
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

Inventory.layout = {
    breadcrumbs: [
        {
            title: 'Inventory',
            href: index(),
        },
    ],
};
