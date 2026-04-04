import { Link } from "@inertiajs/react";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Link
              href={home()}
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="mb-1">
                <img
                  src="/media/brand/logo.svg"
                  alt="myFish"
                  className="h-9 w-auto dark:hidden"
                />
                <img
                  src="/media/brand/logo-dark.svg"
                  alt="myFish"
                  className="hidden h-9 w-auto dark:block"
                />
              </div>
              <span className="sr-only">{title}</span>
            </Link>

            <div className="space-y-2 text-center">
              <h1 className="text-xl font-medium">{title}</h1>
              <p className="text-center text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
