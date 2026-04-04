import { Head, usePage } from "@inertiajs/react";

import { ConversationalOrderFlow } from "@/components/orders/ConversationalOrderFlow";
import { DotPattern } from "@/components/ui/dot-pattern";
import { WelcomeClients } from "@/components/welcome/clients";
import { WelcomeFooter } from "@/components/welcome/footer";
import { WelcomeHeader } from "@/components/welcome/header";
import { WelcomeReviews } from "@/components/welcome/reviews";
import { cn } from "@/lib/utils";

type FishType = { id: number; name: string; price_per_pound: number | null };

type Pricing = {
  price_per_pound: number;
  filleting_fee: number;
  delivery_fee: number;
  kg_to_lbs_rate: number;
};

type Discount = {
  mode: "off" | "fixed" | "percent";
  fixed_sbd: number;
  percent: number;
  max_sbd: number | null;
  min_order_sbd: number | null;
};

type Tax = {
  mode: "off" | "percent";
  percent: number;
  label: string;
};

type ReviewItem = {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ReviewStats = {
  average: number;
  total: number;
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phone: string | null;
} | null;

export default function Welcome({
  fishTypes,
  pricing,
  discount,
  tax,
  canRegister = true,
  reviews,
  reviewStats,
}: {
  fishTypes: FishType[];
  pricing: Pricing;
  discount: Discount;
  tax: Tax;
  canRegister?: boolean;
  reviews: ReviewItem[];
  reviewStats: ReviewStats;
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

      <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
          )}
        />

        <WelcomeHeader
          isLoggedIn={isLoggedIn}
          canRegister={canRegister}
          user={auth?.user ?? null}
        />

        <main className="mx-auto w-full max-w-5xl grow px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="relative rounded-xl bg-background">
            <ConversationalOrderFlow
              fishTypes={fishTypes}
              pricing={pricing}
              discount={discount}
              tax={tax}
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
          </div>

          <WelcomeClients />

          <WelcomeReviews reviews={reviews} stats={reviewStats} />
        </main>

        <WelcomeFooter kgToLbsRate={pricing.kg_to_lbs_rate} />
      </div>
    </>
  );
}
