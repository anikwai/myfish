import {
  ArrowRight01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
  Sorting01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ORDER_STATUS_ICONS } from "@/lib/order-status-icons";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  placed: {
    label: "Placed",
    color: "bg-blue-100 text-blue-700",
    icon: "Clock01Icon",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-700",
    icon: "CheckmarkCircle01Icon",
  },
  on_hold: {
    label: "On hold",
    color: "bg-yellow-100 text-yellow-700",
    icon: "PauseCircleIcon",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: "CancelCircleIcon",
  },
  packed: {
    label: "Packed",
    color: "bg-purple-100 text-purple-700",
    icon: "Package01Icon",
  },
  delivered: {
    label: "Delivered",
    color: "bg-neutral-100 text-neutral-600",
    icon: "PackageDelivered01Icon",
  },
};

export type NotificationTableMeta = {
  onRowClick: (notification: AppNotification) => void;
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <HugeiconsIcon icon={SortByDown01Icon} data-icon="inline-end" />;
  }

  if (sorted === "desc") {
    return <HugeiconsIcon icon={SortByUp01Icon} data-icon="inline-end" />;
  }

  return <HugeiconsIcon icon={Sorting01Icon} data-icon="inline-end" />;
}

export const columns: ColumnDef<AppNotification>[] = [
  {
    id: "notification",
    accessorFn: (row) => row.data.title,
    header: "Notification",
    cell: ({ row }) => {
      const notification = row.original;

      return (
        <div className="flex items-center gap-2">
          {!notification.read_at && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm",
                !notification.read_at && "font-semibold"
              )}
            >
              {notification.data.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {notification.data.message}
            </p>
            {(() => {
              const meta = STATUS_META[notification.data.status];
              return (
                <Badge
                  className={cn(
                    "rounded-full text-xs",
                    meta?.color ?? "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {ORDER_STATUS_ICONS[meta?.icon] && (
                    <HugeiconsIcon
                      icon={ORDER_STATUS_ICONS[meta.icon]}
                      size={11}
                    />
                  )}
                  {meta?.label ?? notification.data.status.replace(/_/g, " ")}
                </Badge>
              );
            })()}
          </div>
        </div>
      );
    },
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
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-default text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {relativeTime(date)}
              </span>
            </TooltipTrigger>
            <TooltipContent suppressHydrationWarning>
              {date.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "chevron",
    cell: () => (
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        className="text-muted-foreground"
      />
    ),
  },
];
