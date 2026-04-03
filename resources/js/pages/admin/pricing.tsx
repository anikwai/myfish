import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import PricingController from '@/actions/App/Http/Controllers/Admin/PricingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
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
import { edit } from '@/routes/admin/pricing';

type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
    kg_to_lbs_rate: number;
};

type Discount = {
    mode: 'off' | 'fixed' | 'percent';
    fixed_sbd: number;
    percent: number;
    max_sbd: number | null;
    min_order_sbd: number | null;
};

type Tax = {
    mode: 'off' | 'percent';
    percent: number;
    label: string;
};

type FishSpeciesRow = {
    id: number;
    name: string;
    is_active: boolean;
    price_per_pound: number | null;
};

export default function Pricing({
    pricing,
    discount,
    tax,
    fishSpecies,
    status,
}: {
    pricing: Pricing;
    discount: Discount;
    tax: Tax;
    fishSpecies: FishSpeciesRow[];
    status?: string;
}) {
    const [kgRate, setKgRate] = useState(pricing.kg_to_lbs_rate);

    return (
        <>
            <Head title="Pricing settings" />

            <div className="space-y-6">
                <Heading
                    title="Pricing settings"
                    description="Configure fish pricing, service add-ons, and unit conversions. Changes apply to new orders only."
                />

                <Form
                    action={PricingController.update.url()}
                    method="patch"
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Global pricing</CardTitle>
                                    <CardDescription>
                                        Default price per pound when a species
                                        has no override below.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="price_per_pound">
                                            Price per pound
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="price_per_pound"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="price_per_pound"
                                                defaultValue={
                                                    pricing.price_per_pound
                                                }
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.price_per_pound}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Species prices</CardTitle>
                                    <CardDescription>
                                        Leave blank to use the global rate.
                                        Overrides apply to new orders only.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-6">
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Species
                                                    </TableHead>
                                                    <TableHead className="w-28">
                                                        Status
                                                    </TableHead>
                                                    <TableHead className="min-w-[10rem] text-right">
                                                        Price / lb (SBD)
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fishSpecies.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">
                                                            {row.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.is_active ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    Active
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <InputGroup className="ml-auto max-w-[11rem]">
                                                                <InputGroupAddon align="inline-end">
                                                                    <InputGroupText>
                                                                        SBD
                                                                    </InputGroupText>
                                                                </InputGroupAddon>
                                                                <InputGroupInput
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    name={`species_prices[${row.id}]`}
                                                                    placeholder={pricing.price_per_pound.toFixed(
                                                                        2,
                                                                    )}
                                                                    defaultValue={
                                                                        row.price_per_pound ===
                                                                        null
                                                                            ? ''
                                                                            : row.price_per_pound
                                                                    }
                                                                    aria-label={`Price per pound for ${row.name}`}
                                                                />
                                                            </InputGroup>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Add-ons</CardTitle>
                                    <CardDescription>
                                        Flat fees charged for optional services
                                        during an order.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="filleting_fee">
                                            Filleting flat fee
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="filleting_fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="filleting_fee"
                                                defaultValue={
                                                    pricing.filleting_fee
                                                }
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.filleting_fee}
                                        />
                                    </div>

                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="delivery_fee">
                                            Delivery flat fee
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="delivery_fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="delivery_fee"
                                                defaultValue={
                                                    pricing.delivery_fee
                                                }
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.delivery_fee}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Order discount</CardTitle>
                                    <CardDescription>
                                        Applied to fish plus any selected
                                        filleting and delivery fees on new
                                        orders, before tax.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="discount_mode">
                                            Discount type
                                        </Label>
                                        <select
                                            id="discount_mode"
                                            name="discount_mode"
                                            defaultValue={discount.mode}
                                            required
                                            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            <option value="off">Off</option>
                                            <option value="fixed">
                                                Fixed amount (SBD)
                                            </option>
                                            <option value="percent">
                                                Percent of subtotal
                                            </option>
                                        </select>
                                        <InputError
                                            message={errors.discount_mode}
                                        />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="discount_fixed_sbd">
                                            Fixed discount (SBD)
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="discount_fixed_sbd"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="discount_fixed_sbd"
                                                defaultValue={
                                                    discount.fixed_sbd
                                                }
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.discount_fixed_sbd}
                                        />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="discount_percent">
                                            Percent off subtotal
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon align="inline-end">
                                                <InputGroupText>
                                                    %
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="discount_percent"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="discount_percent"
                                                defaultValue={discount.percent}
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.discount_percent}
                                        />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="discount_max_sbd">
                                            Max discount cap (optional)
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="discount_max_sbd"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="discount_max_sbd"
                                                defaultValue={
                                                    discount.max_sbd === null
                                                        ? ''
                                                        : discount.max_sbd
                                                }
                                                placeholder="No cap"
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.discount_max_sbd}
                                        />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="discount_min_order_sbd">
                                            Minimum subtotal to qualify
                                            (optional)
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    SBD
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="discount_min_order_sbd"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="discount_min_order_sbd"
                                                defaultValue={
                                                    discount.min_order_sbd ===
                                                    null
                                                        ? ''
                                                        : discount.min_order_sbd
                                                }
                                                placeholder="No minimum"
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={
                                                errors.discount_min_order_sbd
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Sales tax</CardTitle>
                                    <CardDescription>
                                        Exclusive tax applied to the order
                                        subtotal after discount on new orders.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="tax_mode">Tax</Label>
                                        <select
                                            id="tax_mode"
                                            name="tax_mode"
                                            defaultValue={tax.mode}
                                            required
                                            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            <option value="off">Off</option>
                                            <option value="percent">
                                                Percent of subtotal (after
                                                discount)
                                            </option>
                                        </select>
                                        <InputError message={errors.tax_mode} />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="tax_percent">
                                            Tax percent
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon align="inline-end">
                                                <InputGroupText>
                                                    %
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="tax_percent"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="tax_percent"
                                                defaultValue={tax.percent}
                                                required
                                            />
                                        </InputGroup>
                                        <InputError
                                            message={errors.tax_percent}
                                        />
                                    </div>
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="tax_label">
                                            Customer-facing tax label
                                        </Label>
                                        <InputGroup>
                                            <InputGroupInput
                                                id="tax_label"
                                                type="text"
                                                name="tax_label"
                                                maxLength={100}
                                                defaultValue={
                                                    tax.label === 'Tax'
                                                        ? ''
                                                        : tax.label
                                                }
                                                placeholder="Tax"
                                                aria-describedby="tax_label_hint"
                                            />
                                        </InputGroup>
                                        <p
                                            id="tax_label_hint"
                                            className="text-xs text-muted-foreground"
                                        >
                                            Shown on checkout and order receipts
                                            when tax applies. Leave blank for
                                            &quot;Tax&quot;.
                                        </p>
                                        <InputError
                                            message={errors.tax_label}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Units</CardTitle>
                                    <CardDescription>
                                        Conversion factor used to translate
                                        customer-entered weights.
                                    </CardDescription>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-6">
                                    <div className="grid max-w-sm gap-2">
                                        <Label htmlFor="kg_to_lbs_rate">
                                            Kg to lbs conversion rate
                                        </Label>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupText>
                                                    ×
                                                </InputGroupText>
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id="kg_to_lbs_rate"
                                                type="number"
                                                step="0.00001"
                                                min="0"
                                                name="kg_to_lbs_rate"
                                                defaultValue={
                                                    pricing.kg_to_lbs_rate
                                                }
                                                onChange={(e) =>
                                                    setKgRate(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                required
                                            />
                                        </InputGroup>
                                        <p className="text-xs text-muted-foreground">
                                            1 kg = {kgRate} lbs
                                        </p>
                                        <InputError
                                            message={errors.kg_to_lbs_rate}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>
                                    Save changes
                                </Button>

                                <Transition
                                    show={
                                        recentlySuccessful ||
                                        status === 'pricing-updated'
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
        </>
    );
}

Pricing.layout = {
    breadcrumbs: [
        {
            title: 'Pricing settings',
            href: edit(),
        },
    ],
};
