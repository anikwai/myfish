import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminReviewController from "@/actions/App/Http/Controllers/Admin/ReviewController";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { index } from "@/routes/admin/reviews";
import { columns } from "./columns";
import { ReviewsToolbar } from "./data-table-toolbar";
import type { ReviewRow, ReviewTableMeta } from "./columns";

type Stats = {
  average: number;
  total: number;
};

export default function Reviews({
  reviews,
  stats,
}: {
  reviews: ReviewRow[];
  stats: Stats;
}) {
  const [deleting, setDeleting] = useState<number | null>(null);

  function handleDelete(id: number) {
    setDeleting(id);
    router.delete(AdminReviewController.destroy.url({ review: id }), {
      onFinish: () => setDeleting(null),
    });
  }

  const meta: ReviewTableMeta = { onDelete: handleDelete, deleting };

  return (
    <>
      <Head title="Customer reviews" />

      <div className="space-y-6">
        <div className="mb-8 space-y-0.5">
          <h2 className="text-xl font-semibold tracking-tight">
            Customer reviews
          </h2>
          <p className="text-sm text-muted-foreground">
            All reviews submitted by customers after delivery.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Card size="sm" className="min-w-[110px] text-center">
            <CardContent className="flex flex-col items-center gap-0.5 py-3">
              <p className="text-2xl font-bold text-amber-500">
                {stats.total > 0 ? stats.average.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">avg rating</p>
            </CardContent>
          </Card>
          <Card size="sm" className="min-w-[110px] text-center">
            <CardContent className="flex flex-col items-center gap-0.5 py-3">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">total reviews</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={reviews}
          meta={meta as Record<string, unknown>}
          defaultSorting={[{ id: "created_at", desc: true }]}
          toolbar={(table) => <ReviewsToolbar table={table} />}
          emptyTitle="No reviews found"
          emptyDescription={
            deleting !== null
              ? undefined
              : "No reviews have been submitted yet."
          }
        />
      </div>
    </>
  );
}

Reviews.layout = {
  breadcrumbs: [{ title: "Customer reviews", href: index() }],
};
