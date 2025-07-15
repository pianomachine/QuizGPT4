import { Button } from '@/components/ui/button';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

interface Conversation {
    id: string | number;
    title: string;
    messages: Message[];
}

interface ChatSidebarProps {
    conversations: Conversation[];
    currentConversationId: string | number;
    onConversationSelect: (id: string | number) => void;
    onNewConversation: () => void;
    onDeleteConversation: (id: string | number) => void;
}

export function ChatSidebar({
    conversations,
    currentConversationId,
    onConversationSelect,
    onNewConversation,
    onDeleteConversation
}: ChatSidebarProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Chat</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Button 
                            onClick={onNewConversation} 
                            variant="outline"
                            className="w-full justify-start gap-2"
                            size="sm"
                        >
                            <MessageSquare className="h-4 w-4" />
                            New Chat
                        </Button>
                    </SidebarMenuItem>
                    {conversations.map(conversation => (
                        <SidebarMenuItem key={conversation.id}>
                            <div className="flex items-center group">
                                <SidebarMenuButton
                                    onClick={() => onConversationSelect(conversation.id)}
                                    isActive={currentConversationId == conversation.id}
                                    className="flex-1"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="truncate">{conversation.title}</span>
                                </SidebarMenuButton>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conversation.id);
                                    }}
                                    className="ml-2 opacity-0 group-hover:opacity-100 text-xs hover:text-red-500 transition-opacity p-1"
                                >
                                    ×
                                </button>
                            </div>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}