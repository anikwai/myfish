import {
  SortByDown01Icon,
  SortByUp01Icon,
  Sorting01Icon,
  StarIcon,
  StarOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
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

export type ReviewRow = {
  id: number;
  order_id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ReviewTableMeta = {
  onDelete: (id: number) => void;
  deleting: number | null;
};

export const ratingFilterFn: FilterFn<ReviewRow> = (
  row,
  columnId,
  filterValue
) => {
  const rating = row.getValue<number>(columnId);
  if (filterValue === "lte2") {
    return rating <= 2;
  }

  return rating === filterValue;
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
  }

  if (sorted === "desc") {
    return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
  }

  return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

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

export const columns: ColumnDef<ReviewRow>[] = [
  {
    accessorKey: "reviewer_name",
    filterFn: "includesString",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer
        <SortIcon sorted={column.getIsSorted()} />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.reviewer_name}</span>
    ),
  },
  {
    accessorKey: "rating",
    filterFn: ratingFilterFn,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rating
        <SortIcon sorted={column.getIsSorted()} />
      </Button>
    ),
    cell: ({ row }) => <StarRating rating={row.original.rating} />,
  },
  {
    accessorKey: "comment",
    header: "Comment",
    cell: ({ row }) =>
      row.original.comment ? (
        <span className="block max-w-xs truncate text-sm text-muted-foreground">
          {row.original.comment}
        </span>
      ) : (
        <span className="text-sm italic text-muted-foreground">No comment</span>
      ),
  },
  {
    accessorKey: "order_id",
    header: "Order",
    cell: ({ row }) => (
      <Badge variant="outline">#{row.original.order_id}</Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <SortIcon sorted={column.getIsSorted()} />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.created_at).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const { onDelete, deleting } = table.options.meta as ReviewTableMeta;

      return (
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
                {row.original.reviewer_name}. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(row.original.id)}
                disabled={deleting === row.original.id}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
