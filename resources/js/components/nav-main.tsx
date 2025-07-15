import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage, router } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    
    const handleNewChat = () => {
        router.visit('/dashboard', { 
            preserveState: false, 
            replace: true 
        });
    };
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                            asChild={item.title !== 'New Chat'} 
                            isActive={page.url.startsWith(item.href)} 
                            tooltip={{ children: item.title }}
                            onClick={item.title === 'New Chat' ? handleNewChat : undefined}
                        >
                            {item.title === 'New Chat' ? (
                                <>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </>
                            ) : (
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
