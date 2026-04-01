import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, Fish, LayoutGrid, Package, Settings2, ShoppingBag, TrendingUp } from 'lucide-react';

import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import Admin from '@/actions/App/Http/Controllers/Admin';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const userNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'My orders',
        href: OrderController.index.url(),
        icon: ShoppingBag,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Orders',
        href: Admin.OrderController.index.url(),
        icon: ClipboardList,
    },
    {
        title: 'Inventory',
        href: Admin.InventoryController.index.url(),
        icon: Package,
    },
    {
        title: 'Fish types',
        href: Admin.FishTypeController.index.url(),
        icon: Fish,
    },
    {
        title: 'Pricing',
        href: Admin.PricingController.edit.url(),
        icon: Settings2,
    },
    {
        title: 'Reports',
        href: Admin.ReportingController.index.url(),
        icon: TrendingUp,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdminOrStaff = auth.user?.roles?.some((r: string) => ['admin', 'staff'].includes(r)) ?? false;

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
