import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

interface AppSidebarProps {
    chatProps?: {
        conversations: any[];
        currentConversationId: string | number;
        onConversationSelect: (id: string | number) => void;
        onNewConversation: () => void;
        onDeleteConversation: (id: string | number) => void;
        onUpdateConversationTitle: (id: string | number, title: string) => void;
    };
}

export function AppSidebar({ chatProps }: AppSidebarProps) {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {chatProps && (
                    <ChatSidebar
                        conversations={chatProps.conversations}
                        currentConversationId={chatProps.currentConversationId}
                        onConversationSelect={chatProps.onConversationSelect}
                        onNewConversation={chatProps.onNewConversation}
                        onDeleteConversation={chatProps.onDeleteConversation}
                        onUpdateConversationTitle={chatProps.onUpdateConversationTitle}
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
