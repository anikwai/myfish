import {
  StarHalfIcon,
  StarIcon,
  StarOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Review = {
  name: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
};

const reviews: Review[] = [
  {
    name: "Sarah Johnson",
    avatar: "",
    rating: 5,
    date: "2 weeks ago",
    text: "Freshest fish I have ever had delivered. The filleting was perfect and it arrived on time. Will order again!",
  },
  {
    name: "Michael Chen",
    avatar: "",
    rating: 4,
    date: "Yesterday",
    text: "Great service overall. The fish was ocean-fresh and the delivery was smooth. Wish there were more fish varieties.",
  },
  {
    name: "Emma Davis",
    avatar: "",
    rating: 5,
    date: "1 week ago",
    text: "My third order and the quality is consistently excellent. Best fresh fish service in Solomon Islands.",
  },
  {
    name: "James Wilson",
    avatar: "",
    rating: 5,
    date: "4 days ago",
    text: "Outstanding quality. I recommended MyFish to my whole neighbourhood. The customer support is also top notch.",
  },
];

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

export function WelcomeReviews() {
  const average = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="mt-12 sm:mt-16">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Customer Reviews
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-bold tabular-nums text-amber-500">
            {average}
          </span>
          <span>/5</span>
          <span className="text-border">·</span>
          <span>{reviews.length} reviews</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {reviews.map((review) => (
          <div
            key={review.name}
            className="relative rounded-xl border border-border bg-muted p-5"
          >
            {/* Decorative quote glyph */}
            <span className="absolute right-4 top-3 font-serif text-5xl leading-none text-border select-none">
              "
            </span>

            <div className="mb-3 flex items-center gap-3">
              <Avatar className="size-8 shrink-0 rounded-full">
                <AvatarImage
                  src={review.avatar}
                  alt={review.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-full text-[10px] font-semibold">
                  {review.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{review.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {review.date}
                </p>
              </div>
              <StarRating rating={review.rating} />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {review.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
