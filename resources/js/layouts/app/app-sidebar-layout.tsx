import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    chatProps?: {
        conversations: any[];
        currentConversationId: string | number;
        onConversationSelect: (id: string | number) => void;
        onNewConversation: () => void;
        onDeleteConversation: (id: string | number) => void;
        onUpdateConversationTitle: (id: string | number, title: string) => void;
    };
}

export default function AppSidebarLayout({ children, breadcrumbs = [], chatProps }: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar chatProps={chatProps} />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
