import { Link } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { dashboard, login, register } from "@/routes";

type Props = {
  isLoggedIn: boolean;
  canRegister: boolean;
};

export function WelcomeHeader({ isLoggedIn, canRegister }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <span className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
          MyFish
        </span>
        <nav className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <Button asChild size="sm">
              <Link href={dashboard()}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={login()}>Log in</Link>
              </Button>
              {canRegister && (
                <Button size="sm" asChild>
                  <Link href={register()}>Register</Link>
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
