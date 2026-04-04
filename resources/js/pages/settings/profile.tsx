import { Transition } from "@headlessui/react";
import { Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Form, Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useRef } from "react";
import AvatarController from "@/actions/App/Http/Controllers/Settings/AvatarController";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import DeleteUser from "@/components/delete-user";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInitials } from "@/hooks/use-initials";
import { edit } from "@/routes/profile";
import { send } from "@/routes/verification";

export default function Profile({
  mustVerifyEmail,
  status,
}: {
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const { auth } = usePage().props;
  const getInitials = useInitials();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarForm = useForm<{ avatar: File | null }>({ avatar: null });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarForm.setData("avatar", file);
    avatarForm.post(AvatarController.store.url(), { preserveScroll: true });
  }

  function handleRemoveAvatar() {
    router.delete(AvatarController.destroy.url(), { preserveScroll: true });
  }

  return (
    <>
      <Head title="Profile settings" />

      <h1 className="sr-only">Profile settings</h1>

      <div className="space-y-6">
        <div className="space-y-4">
          <Heading
            variant="small"
            title="Avatar"
            description="Click your avatar to upload a new image"
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="group relative cursor-pointer rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarForm.processing}
            >
              <Avatar className="size-16">
                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(auth.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <HugeiconsIcon
                  icon={Camera01Icon}
                  className="size-6 text-white"
                />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="space-y-1">
              {avatarForm.processing && (
                <p className="text-sm text-muted-foreground">Uploading…</p>
              )}
              {avatarForm.errors.avatar && (
                <InputError message={avatarForm.errors.avatar} />
              )}
              {auth.user.avatar && !avatarForm.processing && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-sm text-destructive underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <Heading
          variant="small"
          title="Profile information"
          description="Update your name and email address"
        />

        <Form
          {...ProfileController.update.form()}
          options={{
            preserveScroll: true,
          }}
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>

                <Input
                  id="name"
                  className="mt-1 block w-full"
                  defaultValue={auth.user.name}
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                />

                <InputError className="mt-2" message={errors.name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>

                <Input
                  id="email"
                  type="email"
                  className="mt-1 block w-full"
                  defaultValue={auth.user.email}
                  name="email"
                  required
                  autoComplete="username"
                  placeholder="Email address"
                />

                <InputError className="mt-2" message={errors.email} />
              </div>

              {mustVerifyEmail && auth.user.email_verified_at === null && (
                <div>
                  <p className="-mt-4 text-sm text-muted-foreground">
                    Your email address is unverified.{" "}
                    <Link
                      href={send()}
                      as="button"
                      className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                    >
                      Click here to resend the verification email.
                    </Link>
                  </p>

                  {status === "verification-link-sent" && (
                    <div className="mt-2 text-sm font-medium text-green-600">
                      A new verification link has been sent to your email
                      address.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button disabled={processing} data-test="update-profile-button">
                  Save
                </Button>

                <Transition
                  show={recentlySuccessful}
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

      <DeleteUser />
    </>
  );
}

Profile.layout = {
  breadcrumbs: [
    {
      title: "Profile settings",
      href: edit(),
    },
  ],
};
