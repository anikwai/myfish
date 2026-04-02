import { useState } from 'react';
import { Deferred, Form, Head, useForm } from '@inertiajs/react';
import { Fish, Pencil } from 'lucide-react';
import FishTypeController from '@/actions/App/Http/Controllers/Admin/FishTypeController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { index } from '@/routes/admin/fish-types';

type FishType = {
    id: number;
    name: string;
    is_active: boolean;
};

type PaginatedFishTypes = {
    data: FishType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export default function FishTypes({
    fishTypes,
    status,
}: {
    fishTypes?: PaginatedFishTypes;
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
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Fish Types</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage the species available for ordering.
                    </p>
                </div>

                <Separator />

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
                <Card>
                    <CardHeader>
                        <CardTitle>All Fish Types</CardTitle>
                        <CardDescription>
                            {fishTypes
                                ? fishTypes.total === 0
                                    ? 'No fish types yet.'
                                    : `${fishTypes.total} fish type${fishTypes.total === 1 ? '' : 's'}`
                                : 'Loading...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Deferred
                            data="fishTypes"
                            fallback={
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
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
                            }
                        >
                        {fishTypes?.total === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Fish />
                                    </EmptyMedia>
                                    <EmptyTitle>No fish types yet</EmptyTitle>
                                    <EmptyDescription>
                                        Add your first species using the form above.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fishTypes?.data.map((fishType) => (
                                        <TableRow key={fishType.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{fishType.name}</span>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                                onClick={() => openEdit(fishType)}
                                                                aria-label={`Edit ${fishType.name}`}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Edit name</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={fishType.is_active ? 'outline' : 'secondary'}
                                                    className={fishType.is_active ? 'border-green-200 bg-green-50 text-green-700' : ''}
                                                >
                                                    {fishType.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Form
                                                    {...FishTypeController.update.form(fishType)}
                                                    options={{ preserveScroll: true }}
                                                >
                                                    {({ processing }) => (
                                                        <>
                                                            <input
                                                                type="hidden"
                                                                name="is_active"
                                                                value={fishType.is_active ? '0' : '1'}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={processing}
                                                            >
                                                                {fishType.is_active ? 'Deactivate' : 'Activate'}
                                                            </Button>
                                                        </>
                                                    )}
                                                </Form>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {fishTypes && fishTypes.last_page > 1 && (
                                <div className="border-t px-4 py-3">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={fishTypes.links[0].url ?? '#'}
                                                    aria-disabled={!fishTypes.links[0].url}
                                                    className={!fishTypes.links[0].url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                            {fishTypes.links.slice(1, -1).map((link) => (
                                                <PaginationItem key={link.label}>
                                                    <PaginationLink href={link.url ?? '#'} isActive={link.active}>
                                                        {link.label}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href={fishTypes.links[fishTypes.links.length - 1].url ?? '#'}
                                                    aria-disabled={!fishTypes.links[fishTypes.links.length - 1].url}
                                                    className={!fishTypes.links[fishTypes.links.length - 1].url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                            </>
                        )}
                        </Deferred>
                    </CardContent>
                </Card>
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDialog}
                                disabled={editProcessing}
                            >
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
