import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import FishTypeController from '@/actions/App/Http/Controllers/Admin/FishTypeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/fish-types';

type FishType = {
    id: number;
    name: string;
    is_active: boolean;
};

export default function FishTypes({
    fishTypes,
    status,
}: {
    fishTypes: FishType[];
    status?: string;
}) {
    return (
        <>
            <Head title="Fish types" />

            <div className="space-y-8">
                <Heading title="Fish types" />
                <div className="space-y-4">
                    <Heading
                        variant="small"
                        title="Add fish type"
                        description="New fish types are active by default."
                    />

                    <Form
                        {...FishTypeController.store.form()}
                        options={{ preserveScroll: true }}
                        className="flex items-end gap-3"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Tuna"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <Button disabled={processing}>Add</Button>

                                <Transition
                                    show={
                                        recentlySuccessful ||
                                        status === 'fish-type-created'
                                    }
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">
                                        Added
                                    </p>
                                </Transition>
                            </>
                        )}
                    </Form>
                </div>

                <div className="space-y-4">
                    <Heading variant="small" title="All fish types" />

                    {fishTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No fish types yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fishTypes.map((fishType) => (
                                        <tr
                                            key={fishType.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2">
                                                {fishType.name}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${fishType.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                                                >
                                                    {fishType.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Form
                                                    {...FishTypeController.update.form(
                                                        fishType,
                                                    )}
                                                    options={{
                                                        preserveScroll: true,
                                                    }}
                                                >
                                                    {({ processing }) => (
                                                        <>
                                                            <input
                                                                type="hidden"
                                                                name="is_active"
                                                                value={
                                                                    fishType.is_active
                                                                        ? '0'
                                                                        : '1'
                                                                }
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                {fishType.is_active
                                                                    ? 'Deactivate'
                                                                    : 'Activate'}
                                                            </Button>
                                                        </>
                                                    )}
                                                </Form>
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

FishTypes.layout = {
    breadcrumbs: [
        {
            title: 'Fish types',
            href: index(),
        },
    ],
};
