import { Transition } from "@headlessui/react";
import { Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Form, Head } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import SocialiteController from "@/actions/App/Http/Controllers/Auth/SocialiteController";
import SecurityController from "@/actions/App/Http/Controllers/Settings/SecurityController";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import TwoFactorRecoveryCodes from "@/components/two-factor-recovery-codes";
import TwoFactorSetupModal from "@/components/two-factor-setup-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTwoFactorAuth } from "@/hooks/use-two-factor-auth";
import { edit } from "@/routes/security";
import { disable, enable } from "@/routes/two-factor";

type Props = {
  canManageTwoFactor?: boolean;
  requiresConfirmation?: boolean;
  twoFactorEnabled?: boolean;
  googleConnected?: boolean;
  hasPassword?: boolean;
};

export default function Security({
  canManageTwoFactor = false,
  requiresConfirmation = false,
  twoFactorEnabled = false,
  googleConnected = false,
  hasPassword = true,
}: Props) {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    clearTwoFactorAuthData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
  } = useTwoFactorAuth();
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const prevTwoFactorEnabled = useRef(twoFactorEnabled);

  useEffect(() => {
    if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
      clearTwoFactorAuthData();
    }

    prevTwoFactorEnabled.current = twoFactorEnabled;
  }, [twoFactorEnabled, clearTwoFactorAuthData]);

  return (
    <>
      <Head title="Security settings" />

      <h1 className="sr-only">Security settings</h1>

      <div className="space-y-6">
        <Heading
          variant="small"
          title="Update password"
          description="Ensure your account is using a long, random password to stay secure"
        />

        <Form
          {...SecurityController.update.form()}
          options={{
            preserveScroll: true,
          }}
          resetOnError={[
            "password",
            "password_confirmation",
            "current_password",
          ]}
          resetOnSuccess
          onError={(errors) => {
            if (errors.password) {
              passwordInput.current?.focus();
            }

            if (errors.current_password) {
              currentPasswordInput.current?.focus();
            }
          }}
          className="space-y-6"
        >
          {({ errors, processing, recentlySuccessful }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="current_password">Current password</Label>

                <PasswordInput
                  id="current_password"
                  ref={currentPasswordInput}
                  name="current_password"
                  className="mt-1 block w-full"
                  autoComplete="current-password"
                  placeholder="Current password"
                />

                <InputError message={errors.current_password} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>

                <PasswordInput
                  id="password"
                  ref={passwordInput}
                  name="password"
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                  placeholder="New password"
                />

                <InputError message={errors.password} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>

                <PasswordInput
                  id="password_confirmation"
                  name="password_confirmation"
                  className="mt-1 block w-full"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                />

                <InputError message={errors.password_confirmation} />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  disabled={processing}
                  data-test="update-password-button"
                >
                  Save password
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

      {canManageTwoFactor && (
        <div className="space-y-6">
          <Heading
            variant="small"
            title="Two-factor authentication"
            description="Manage your two-factor authentication settings"
          />
          {twoFactorEnabled ? (
            <div className="flex flex-col items-start justify-start space-y-4">
              <p className="text-sm text-muted-foreground">
                You will be prompted for a secure, random pin during login,
                which you can retrieve from the TOTP-supported application on
                your phone.
              </p>

              <div className="relative inline">
                <Form {...disable.form()}>
                  {({ processing }) => (
                    <Button
                      variant="destructive"
                      type="submit"
                      disabled={processing}
                    >
                      Disable 2FA
                    </Button>
                  )}
                </Form>
              </div>

              <TwoFactorRecoveryCodes
                recoveryCodesList={recoveryCodesList}
                fetchRecoveryCodes={fetchRecoveryCodes}
                errors={errors}
              />
            </div>
          ) : (
            <div className="flex flex-col items-start justify-start space-y-4">
              <p className="text-sm text-muted-foreground">
                When you enable two-factor authentication, you will be prompted
                for a secure pin during login. This pin can be retrieved from a
                TOTP-supported application on your phone.
              </p>

              <div>
                {hasSetupData ? (
                  <Button onClick={() => setShowSetupModal(true)}>
                    <HugeiconsIcon icon={Shield01Icon} size={16} />
                    Continue setup
                  </Button>
                ) : (
                  <Form
                    {...enable.form()}
                    onSuccess={() => setShowSetupModal(true)}
                  >
                    {({ processing }) => (
                      <Button type="submit" disabled={processing}>
                        Enable 2FA
                      </Button>
                    )}
                  </Form>
                )}
              </div>
            </div>
          )}

          <TwoFactorSetupModal
            isOpen={showSetupModal}
            onClose={() => setShowSetupModal(false)}
            requiresConfirmation={requiresConfirmation}
            twoFactorEnabled={twoFactorEnabled}
            qrCodeSvg={qrCodeSvg}
            manualSetupKey={manualSetupKey}
            clearSetupData={clearSetupData}
            fetchSetupData={fetchSetupData}
            errors={errors}
          />
        </div>
      )}

      <div className="space-y-6">
        <Heading
          variant="small"
          title="Google account"
          description="Connect your Google account to sign in without a password"
        />

        <div className="flex flex-col items-start gap-4">
          {googleConnected ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your Google account is connected. You can sign in with Google at
                any time.
              </p>
              <Form
                {...SocialiteController.disconnect.form()}
                options={{ preserveScroll: true }}
              >
                {({ processing, errors }) => (
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={processing || !hasPassword}
                      data-test="disconnect-google-button"
                    >
                      Disconnect Google
                    </Button>
                    {!hasPassword && (
                      <p className="text-sm text-muted-foreground">
                        Set a password before disconnecting Google to avoid
                        losing access to your account.
                      </p>
                    )}
                    {errors.google && (
                      <p className="text-sm text-destructive">
                        {errors.google}
                      </p>
                    )}
                  </div>
                )}
              </Form>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No Google account connected.
              </p>
              <a href={SocialiteController.connect.url()}>
                <Button
                  type="button"
                  variant="outline"
                  data-test="connect-google-button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connect Google
                </Button>
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}

Security.layout = {
  breadcrumbs: [
    {
      title: "Security settings",
      href: edit(),
    },
  ],
};
