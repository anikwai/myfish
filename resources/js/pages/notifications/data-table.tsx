import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";
import type { NotificationTableMeta } from "./columns";

type Pagination = {
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

interface DataTableProps {
  columns: ColumnDef<AppNotification>[];
  data: AppNotification[];
  pagination: Pagination;
  meta: NotificationTableMeta;
}

export function DataTable({ columns, data, pagination, meta }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredData = useMemo(
    () => (showUnreadOnly ? data.filter((n) => !n.read_at) : data),
    [data, showUnreadOnly]
  );

  const unreadCount = useMemo(
    () => data.filter((n) => !n.read_at).length,
    [data]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    meta,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={!showUnreadOnly ? "secondary" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => setShowUnreadOnly(false)}
        >
          All
        </Button>
        <Button
          variant={showUnreadOnly ? "secondary" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => setShowUnreadOnly(true)}
        >
          Unread
          {unreadCount > 0 && (
            <Badge className="ml-1 h-4 min-w-4 rounded-full bg-blue-500 px-1 text-[10px] text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "cursor-pointer",
                    !row.original.read_at &&
                      "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                  )}
                  onClick={() =>
                    (table.options.meta as NotificationTableMeta).onRowClick(
                      row.original
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Empty className="border-0 py-8">
                    <EmptyHeader>
                      <HugeiconsIcon
                        icon={Notification03Icon}
                        size={32}
                        className="text-muted-foreground"
                      />
                      <EmptyTitle>
                        {showUnreadOnly
                          ? "No unread notifications"
                          : "No notifications"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {showUnreadOnly
                          ? "You're all caught up."
                          : "You'll see order updates here when they arrive."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(pagination.prev_page_url || pagination.next_page_url) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.prev_page_url}
            asChild={!!pagination.prev_page_url}
          >
            {pagination.prev_page_url ? (
              <Link href={pagination.prev_page_url}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.next_page_url}
            asChild={!!pagination.next_page_url}
          >
            {pagination.next_page_url ? (
              <Link href={pagination.next_page_url}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
