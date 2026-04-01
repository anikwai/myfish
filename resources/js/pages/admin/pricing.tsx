import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import PricingController from '@/actions/App/Http/Controllers/Admin/PricingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/admin/pricing';

type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
};

export default function Pricing({
    pricing,
    status,
}: {
    pricing: Pricing;
    status?: string;
}) {
    return (
        <>
            <Head title="Pricing settings" />

            <div className="space-y-6">
                <Heading
                    title="Pricing settings"
                    description="Set the price per pound and flat fees for filleting and delivery. Changes apply to new orders only."
                />

                <Form
                    {...PricingController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="price_per_pound">
                                    Price per pound (SBD)
                                </Label>
                                <Input
                                    id="price_per_pound"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="price_per_pound"
                                    defaultValue={pricing.price_per_pound}
                                    required
                                />
                                <InputError message={errors.price_per_pound} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filleting_fee">
                                    Filleting flat fee (SBD)
                                </Label>
                                <Input
                                    id="filleting_fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="filleting_fee"
                                    defaultValue={pricing.filleting_fee}
                                    required
                                />
                                <InputError message={errors.filleting_fee} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="delivery_fee">
                                    Delivery flat fee (SBD)
                                </Label>
                                <Input
                                    id="delivery_fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="delivery_fee"
                                    defaultValue={pricing.delivery_fee}
                                    required
                                />
                                <InputError message={errors.delivery_fee} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>
                                    Save pricing
                                </Button>

                                <Transition
                                    show={recentlySuccessful || status === 'pricing-updated'}
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
