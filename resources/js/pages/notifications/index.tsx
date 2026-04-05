import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Head, router, useForm } from "@inertiajs/react";
import Heading from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  index as notificationsIndex,
  read,
  readAll,
} from "@/routes/notifications";
import { show as ordersShow } from "@/routes/orders";
import type { AppNotification } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";

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

  function handleRowClick(notification: AppNotification) {
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
  const { data, ...pagination } = notifications;

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

        {data.length === 0 ? (
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
          <DataTable
            columns={columns}
            data={data}
            pagination={pagination}
            meta={{ onRowClick: handleRowClick }}
          />
        )}
      </div>
    </>
  );
}

NotificationsIndex.layout = {
  breadcrumbs: [{ title: "Notifications", href: notificationsIndex.url() }],
};
