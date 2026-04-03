import {
  StarHalfIcon,
  StarIcon,
  StarOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;

        return (
          <HugeiconsIcon
            key={i}
            icon={filled ? StarIcon : half ? StarHalfIcon : StarOffIcon}
            size={13}
            className={
              filled || half ? "text-amber-500" : "text-muted-foreground/30"
            }
          />
        );
      })}
    </div>
  );
}

export function WelcomeReviews({
  reviews,
  stats,
}: {
  reviews: ReviewItem[];
  stats: ReviewStats;
}) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 sm:mt-16">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Customer Reviews
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-bold tabular-nums text-amber-500">
            {stats.average.toFixed(1)}
          </span>
          <span>/5</span>
          <span className="text-border">·</span>
          <span>
            {stats.total} review{stats.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="relative rounded-xl border border-border bg-muted p-5"
          >
            {/* Decorative quote glyph */}
            <span className="absolute right-4 top-3 font-serif text-5xl leading-none text-border select-none">
              "
            </span>

            <div className="mb-3 flex items-center gap-3">
              <Avatar className="size-8 shrink-0 rounded-full">
                <AvatarFallback className="rounded-full text-[10px] font-semibold">
                  {review.reviewer_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {review.reviewer_name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StarRating rating={review.rating} />
            </div>

            {review.comment && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
