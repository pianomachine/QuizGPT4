import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    chatProps?: {
        conversations: any[];
        currentConversationId: string | number;
        onConversationSelect: (id: string | number) => void;
        onNewConversation: () => void;
        onDeleteConversation: (id: string | number) => void;
    };
}

export default ({ children, breadcrumbs, chatProps, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} chatProps={chatProps} {...props}>
        {children}
    </AppLayoutTemplate>
);
