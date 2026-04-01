import { Head, Link, usePage } from '@inertiajs/react';

import { ConversationalOrderFlow } from '@/components/orders/ConversationalOrderFlow';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';

type FishType = { id: number; name: string };
type Pricing = {
    price_per_pound: number;
    filleting_fee: number;
    delivery_fee: number;
};
type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
} | null;

export default function Welcome({
    fishTypes,
    pricing,
    canRegister = true,
}: {
    fishTypes: FishType[];
    pricing: Pricing;
    canRegister?: boolean;
}) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <Head title="Place an order — MyFish">
                <meta
                    name="description"
                    content="Order fresh fish online in Solomon Islands. Filleting and delivery available."
                />
            </Head>

            <div className="min-h-screen bg-background">
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                        <span className="text-xl font-bold tracking-tight text-primary sm:text-2xl">MyFish</span>
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

                <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Place an order</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Fresh fish, Solomon Islands</p>
                    </div>

                    <ConversationalOrderFlow
                        fishTypes={fishTypes}
                        pricing={pricing}
                        authenticatedContact={
                            auth?.user
                                ? {
                                      name: auth.user.name,
                                      email: auth.user.email,
                                      phone: auth.user.phone,
                                  }
                                : undefined
                        }
                    />
                </main>

                <footer className="border-t py-8">
                    <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                        <p className="text-sm text-muted-foreground">MyFish — Fresh fish, Solomon Islands</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
