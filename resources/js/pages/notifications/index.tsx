import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import Heading from "@/components/heading";
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
import {
  index as notificationsIndex,
  read,
  readAll,
} from "@/routes/notifications";
import { show as ordersShow } from "@/routes/orders";
import type { AppNotification } from "@/types";

type PaginatedNotifications = {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

type Props = {
  notifications: PaginatedNotifications;
};

export default function NotificationsIndex({ notifications }: Props) {
  const { post: markAllRead, processing: markingAll } = useForm({});

  function handleMarkAllRead() {
    markAllRead(readAll.url(), { preserveScroll: true });
  }

  function handleClickNotification(notification: AppNotification) {
    if (!notification.read_at) {
      router.post(
        read.url(notification.id),
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            router.visit(ordersShow.url(notification.data.order_id));
          },
        }
      );
    } else {
      router.visit(ordersShow.url(notification.data.order_id));
    }
  }

  const unreadCount = notifications.data.filter((n) => !n.read_at).length;

  return (
    <>
      <Head title="Notifications" />
      <div className="px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Heading
            title="Notifications"
            description="Your order updates and alerts."
          />
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.data.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <HugeiconsIcon
                icon={Notification03Icon}
                size={40}
                className="text-muted-foreground"
              />
            </EmptyHeader>
            <EmptyTitle>No notifications</EmptyTitle>
            <EmptyDescription>
              You'll see order updates here when they arrive.
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.data.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={cn(
                      "cursor-pointer",
                      !notification.read_at &&
                        "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                    )}
                    onClick={() => handleClickNotification(notification)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!notification.read_at && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                        <div>
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={notification.read_at ? "secondary" : "default"}
                      >
                        {notification.read_at ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right text-sm text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {new Date(notification.created_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(notifications.prev_page_url || notifications.next_page_url) && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!notifications.prev_page_url}
                  asChild={!!notifications.prev_page_url}
                >
                  {notifications.prev_page_url ? (
                    <Link href={notifications.prev_page_url}>Previous</Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {notifications.current_page} of {notifications.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!notifications.next_page_url}
                  asChild={!!notifications.next_page_url}
                >
                  {notifications.next_page_url ? (
                    <Link href={notifications.next_page_url}>Next</Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

NotificationsIndex.layout = {
  breadcrumbs: [{ title: "Notifications", href: notificationsIndex.url() }],
};
