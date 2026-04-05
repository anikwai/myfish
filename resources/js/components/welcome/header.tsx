import { Link } from "@inertiajs/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInitials } from "@/hooks/use-initials";
import { dashboard, login, register } from "@/routes";
import { edit as profileEdit } from "@/routes/profile";
import { edit as securityEdit } from "@/routes/security";

type AuthUser = {
  name: string;
  avatar?: string;
} | null;

type Props = {
  isLoggedIn: boolean;
  canRegister: boolean;
  user?: AuthUser;
};

export function WelcomeHeader({ isLoggedIn, canRegister, user }: Props) {
  const getInitials = useInitials();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center">
          <img
            src="/media/brand/logo.svg"
            alt="myFish"
            className="h-8 w-auto max-w-full dark:hidden"
          />
          <img
            src="/media/brand/logo-dark.svg"
            alt="myFish"
            className="hidden h-8 w-auto max-w-full dark:block"
          />
        </Link>
        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href={dashboard()}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileEdit()}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={securityEdit()}>Security</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
