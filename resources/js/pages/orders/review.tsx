import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
  StarHalfIcon,
  StarIcon,
  StarOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Order = {
  id: number;
  customer_name: string;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            className="cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={star <= active ? StarIcon : StarOffIcon}
              size={32}
              className={
                star <= active ? "text-amber-500" : "text-muted-foreground/30"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

export default function Review({
  order,
  already_reviewed,
  store_url,
}: {
  order: Order;
  already_reviewed: boolean;
  store_url: string;
}) {
  const { props } = usePage<{ flash: { status?: string } }>();
  const submitted =
    already_reviewed || props.flash?.status === "review-submitted";

  const { data, setData, post, processing, errors } = useForm({
    rating: 0,
    comment: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post(store_url, { preserveScroll: true });
  }

  return (
    <>
      <Head title={`Review order #${order.id}`} />

      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          {submitted ? (
            <div className="rounded-xl border bg-muted p-8 text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <h1 className="text-xl font-semibold">Thanks for your review!</h1>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us serve you better.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">How was your order?</h1>
                <p className="text-sm text-muted-foreground">
                  Order #{order.id} · {order.customer_name}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-xl border bg-card p-6 space-y-6"
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your rating</p>
                  <StarPicker
                    value={data.rating}
                    onChange={(v) => setData("rating", v)}
                  />
                  <InputError message={errors.rating} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Comment{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    id="comment"
                    value={data.comment}
                    onChange={(e) => setData("comment", e.target.value)}
                    placeholder="Tell us about your experience…"
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {data.comment.length}/500
                  </p>
                  <InputError message={errors.comment} />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={processing || data.rating === 0}
                >
                  Submit review
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
