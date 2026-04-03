import {
  AnalyticsUpIcon,
  Building04Icon,
  ClipboardIcon,
  DashboardSquare01Icon,
  FishFoodIcon,
  Package01Icon,
  Settings02Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { Link, usePage } from "@inertiajs/react";

import Admin from "@/actions/App/Http/Controllers/Admin";
import OrderController from "@/actions/App/Http/Controllers/OrderController";
import AppLogo from "@/components/app-logo";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboard } from "@/routes";
import { edit as editBusiness } from "@/routes/admin/business";
import type { NavItem } from "@/types";

const userNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: dashboard(),
    icon: DashboardSquare01Icon,
  },
  {
    title: "My orders",
    href: OrderController.index.url(),
    icon: ShoppingBag01Icon,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Orders",
    href: Admin.OrderController.index.url(),
    icon: ClipboardIcon,
  },
  {
    title: "Inventory",
    href: Admin.InventoryController.index.url(),
    icon: Package01Icon,
  },
  {
    title: "Fish types",
    href: Admin.FishTypeController.index.url(),
    icon: FishFoodIcon,
  },
  {
    title: "Pricing",
    href: Admin.PricingController.edit.url(),
    icon: Settings02Icon,
  },
  {
    title: "Business",
    href: editBusiness(),
    icon: Building04Icon,
  },
  {
    title: "Reports",
    href: Admin.ReportingController.index.url(),
    icon: AnalyticsUpIcon,
  },
];

export function AppSidebar() {
  const { auth } = usePage().props;
  const isAdminOrStaff =
    auth.user?.roles?.some((r: string) => ["admin", "staff"].includes(r)) ??
    false;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboard()} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={userNavItems} label="Menu" />
        {isAdminOrStaff && <NavMain items={adminNavItems} label="Admin" />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
