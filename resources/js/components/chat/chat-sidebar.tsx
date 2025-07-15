import { Button } from '@/components/ui/button';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MessageSquare, Edit3 } from 'lucide-react';
import { useState } from 'react';

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
    onUpdateConversationTitle: (id: string | number, title: string) => void;
}

export function ChatSidebar({
    conversations,
    currentConversationId,
    onConversationSelect,
    onNewConversation,
    onDeleteConversation,
    onUpdateConversationTitle
}: ChatSidebarProps) {
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    const handleStartEdit = (conversation: Conversation) => {
        setEditingId(conversation.id);
        setEditingTitle(conversation.title);
    };

    const handleSaveEdit = async () => {
        if (editingId && editingTitle.trim()) {
            await onUpdateConversationTitle(editingId, editingTitle.trim());
            setEditingId(null);
            setEditingTitle('');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingTitle('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

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
                                {editingId === conversation.id ? (
                                    <div className="flex-1 flex items-center gap-2 px-2 py-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            onBlur={handleSaveEdit}
                                            className="flex-1 bg-transparent border-none outline-none text-sm"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <SidebarMenuButton
                                        onClick={() => onConversationSelect(conversation.id)}
                                        isActive={currentConversationId == conversation.id}
                                        className="flex-1"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="truncate">{conversation.title}</span>
                                    </SidebarMenuButton>
                                )}
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(conversation);
                                        }}
                                        className="p-1 hover:text-blue-500 transition-colors"
                                        title="Edit title"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteConversation(conversation.id);
                                        }}
                                        className="p-1 hover:text-red-500 transition-colors"
                                        title="Delete conversation"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}