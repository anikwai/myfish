import { Transition } from "@headlessui/react";
import { Form, Head, router, useForm } from "@inertiajs/react";
import { useRef } from "react";
import BusinessController from "@/actions/App/Http/Controllers/Admin/BusinessController";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { edit } from "@/routes/admin/business";

type Business = {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
};

export default function Business({
  business,
  status,
}: {
  business: Business;
  status?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoForm = useForm<{ logo: File | null }>({ logo: null });

  function handleLogoSubmit(e: React.FormEvent) {
    e.preventDefault();
    logoForm.post(BusinessController.storeLogo.url(), {
      forceFormData: true,
      onSuccess: () => {
        logoForm.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  }

  function handleLogoRemove() {
    router.delete(BusinessController.destroyLogo.url());
  }

  return (
    <>
      <Head title="Business settings" />

      <div className="space-y-6">
        <Heading
          title="Business settings"
          description="Business details that appear on invoices and receipts sent to customers."
        />

        <Form
          action={BusinessController.update.url()}
          method="patch"
          options={{ preserveScroll: true }}
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Business details</CardTitle>
                  <CardDescription>
                    These details are printed on every invoice and receipt.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4 pt-6">
                  <div className="grid max-w-sm gap-2">
                    <Label htmlFor="business_name">
                      Business name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      defaultValue={business.name}
                      placeholder="TZ Holding Ltd"
                      maxLength={255}
                      required
                    />
                    <InputError message={errors.business_name} />
                  </div>

                  <div className="grid max-w-sm gap-2">
                    <Label htmlFor="business_address">
                      Address{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="business_address"
                      name="business_address"
                      defaultValue={business.address}
                      placeholder="123 Main St, Honiara"
                      maxLength={255}
                    />
                    <InputError message={errors.business_address} />
                  </div>

                  <div className="grid max-w-sm gap-2">
                    <Label htmlFor="business_phone">
                      Phone{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="business_phone"
                      name="business_phone"
                      defaultValue={business.phone}
                      placeholder="+677 ..."
                      maxLength={50}
                    />
                    <InputError message={errors.business_phone} />
                  </div>

                  <div className="grid max-w-sm gap-2">
                    <Label htmlFor="business_email">
                      Email{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="business_email"
                      name="business_email"
                      type="email"
                      defaultValue={business.email}
                      placeholder="info@example.com"
                      maxLength={255}
                    />
                    <InputError message={errors.business_email} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-4">
                <Button disabled={processing}>Save changes</Button>

                <Transition
                  show={recentlySuccessful || status === "business-updated"}
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

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              PNG, JPG, WebP, GIF, or SVG (max 2 MB). For email, SVG is
              converted to PNG when the Imagick PHP extension is available;
              otherwise the business name is shown instead of the logo.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-6">
            {business.logo_url && (
              <div className="flex items-center gap-4">
                <img
                  src={business.logo_url}
                  alt="Business logo"
                  className="h-16 w-auto rounded border object-contain p-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleLogoRemove}
                >
                  Remove logo
                </Button>
              </div>
            )}

            <form onSubmit={handleLogoSubmit} className="flex items-end gap-3">
              <div className="grid gap-2">
                <Label htmlFor="logo">
                  {business.logo_url ? "Replace logo" : "Upload logo"}
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) =>
                    logoForm.setData("logo", e.target.files?.[0] ?? null)
                  }
                  className="w-64"
                />
                <InputError message={logoForm.errors.logo} />
              </div>
              <Button
                type="submit"
                disabled={logoForm.processing || !logoForm.data.logo}
              >
                Upload
              </Button>
            </form>

            {(status === "logo-updated" || status === "logo-removed") && (
              <p className="text-sm text-neutral-600">
                {status === "logo-updated" ? "Logo updated" : "Logo removed"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

Business.layout = {
  breadcrumbs: [
    {
      title: "Business settings",
      href: edit(),
    },
  ],
};
