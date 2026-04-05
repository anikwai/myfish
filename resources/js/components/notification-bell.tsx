import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { router, useHttp, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  index as notificationsIndex,
  read,
  readAll,
  recent,
} from "@/routes/notifications";
import { show as ordersShow } from "@/routes/orders";
import type { AppNotification } from "@/types";

export function NotificationBell() {
  const { auth } = usePage().props;
  const [unreadCount, setUnreadCount] = useState(
    auth.unreadNotificationsCount ?? 0
  );
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const { get: fetchRecent, processing } = useHttp({});

  const loadRecent = useCallback(() => {
    fetchRecent(recent.url(), {
      onSuccess: (data: unknown) => {
        setNotifications(data as AppNotification[]);
      },
    });
  }, [fetchRecent]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open) {
      loadRecent();
    }
  }, [open, loadRecent]);

  // Listen for real-time notifications via Echo
  useEffect(() => {
    if (!auth.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);

    channel.notification(
      (
        notification: AppNotification["data"] & {
          id: string;
          created_at: string;
        }
      ) => {
        setUnreadCount((c) => c + 1);

        const newNotif: AppNotification = {
          id: notification.id,
          data: {
            title: notification.title,
            message: notification.message,
            order_id: notification.order_id,
            status: notification.status,
          },
          read_at: null,
          created_at: notification.created_at ?? new Date().toISOString(),
        };

        setNotifications((prev) => [newNotif, ...prev]);

        toast(notification.title, {
          description: notification.message,
          action: {
            label: "View order",
            onClick: () => router.visit(ordersShow.url(notification.order_id)),
          },
        });
      }
    );

    return () => {
      window.Echo.leave(`App.Models.User.${auth.user.id}`);
    };
  }, [auth.user?.id]);

  function handleMarkAllRead() {
    fetch(readAll.url(), {
      method: "POST",
      headers: { "X-CSRF-TOKEN": getCsrfToken() },
    }).then(() => {
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    });
  }

  function handleClickNotification(notification: AppNotification) {
    if (!notification.read_at) {
      fetch(read.url(notification.id), {
        method: "POST",
        headers: { "X-CSRF-TOKEN": getCsrfToken() },
      }).then(() => {
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      });
    }
    setOpen(false);
    router.visit(ordersShow.url(notification.data.order_id));
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group relative h-9 w-9 cursor-pointer"
        >
          <HugeiconsIcon
            icon={Notification03Icon}
            size={20}
            className="opacity-80 group-hover:opacity-100"
          />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {processing && notifications.length === 0 && (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-1">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        {!processing && notifications.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </p>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5",
              !notification.read_at && "bg-blue-50/50 dark:bg-blue-950/20"
            )}
            onClick={() => handleClickNotification(notification)}
          >
            <div className="flex w-full items-center gap-2">
              {!notification.read_at && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  !notification.read_at && "font-semibold"
                )}
              >
                {notification.data.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {notification.data.message}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {new Date(notification.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </DropdownMenuItem>
        ))}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="justify-center py-2 text-center text-sm"
            >
              <a href={notificationsIndex.url()}>View all notifications</a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getCsrfToken(): string {
  return (
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
      ?.content ?? ""
  );
}
