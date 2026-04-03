import { StarIcon, StarOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminReviewController from "@/actions/App/Http/Controllers/Admin/ReviewController";
import Heading from "@/components/heading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { index } from "@/routes/admin/reviews";

type ReviewRow = {
  id: number;
  order_id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Stats = {
  average: number;
  total: number;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <HugeiconsIcon
          key={i}
          icon={i < rating ? StarIcon : StarOffIcon}
          size={13}
          className={i < rating ? "text-amber-500" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

export default function Reviews({
  reviews,
  stats,
  status,
}: {
  reviews: ReviewRow[];
  stats: Stats;
  status?: string;
}) {
  const [deleting, setDeleting] = useState<number | null>(null);

  function handleDelete(id: number) {
    setDeleting(id);
    router.delete(AdminReviewController.destroy.url({ review: id }), {
      onFinish: () => setDeleting(null),
    });
  }

  return (
    <>
      <Head title="Customer reviews" />

      <div className="space-y-6">
        <Heading
          title="Customer reviews"
          description="All reviews submitted by customers after delivery."
        />

        <div className="flex items-center gap-6">
          <div className="rounded-lg border px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-amber-500">
              {stats.total > 0 ? stats.average.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">avg rating</p>
          </div>
          <div className="rounded-lg border px-4 py-3 text-center min-w-[100px]">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">total reviews</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.reviewer_name}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {review.comment ?? (
                      <span className="italic">No comment</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">#{review.order_id}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(review.created_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete review?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the review from{" "}
                            {review.reviewer_name}. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(review.id)}
                            disabled={deleting === review.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

Reviews.layout = {
  breadcrumbs: [{ title: "Customer reviews", href: index() }],
};
