import ChatInterface from '@/components/chat/chat-interface';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Message {
    id: string | number;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

interface Conversation {
    id: string | number;
    title: string;
    messages: Message[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    conversation_id?: number;
}

export default function Dashboard({ conversation_id }: DashboardProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | number>(conversation_id || '');

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (conversation_id) {
            setCurrentConversationId(conversation_id);
        }
    }, [conversation_id]);

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            
            if (data.conversations) {
                const formattedConversations = data.conversations.map((conv: any) => ({
                    id: conv.id,
                    title: conv.title,
                    messages: conv.messages.map((msg: any) => ({
                        id: msg.id,
                        content: msg.content,
                        role: msg.role,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));
                
                setConversations(formattedConversations);
                
                // If there's a conversation_id from URL, validate it exists
                if (conversation_id && formattedConversations.length > 0) {
                    const conversationExists = formattedConversations.some(conv => conv.id == conversation_id);
                    if (!conversationExists) {
                        // Conversation doesn't exist, redirect to first conversation or dashboard
                        if (formattedConversations.length > 0) {
                            setCurrentConversationId(formattedConversations[0].id);
                            router.visit(`/chat/${formattedConversations[0].id}`, { 
                                preserveState: true, 
                                replace: true 
                            });
                        } else {
                            router.visit('/dashboard', { 
                                preserveState: true, 
                                replace: true 
                            });
                        }
                    }
                }
                
                // Set current conversation to first one if none selected
                if (formattedConversations.length > 0 && !currentConversationId) {
                    setCurrentConversationId(formattedConversations[0].id);
                    router.visit(`/chat/${formattedConversations[0].id}`, { 
                        preserveState: true, 
                        replace: true 
                    });
                }
                
                // Create a new conversation if none exist
                if (formattedConversations.length === 0) {
                    await createInitialConversation();
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const createInitialConversation = async () => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    title: 'New Chat'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const newConversation: Conversation = {
                    id: data.conversation.id,
                    title: data.conversation.title,
                    messages: []
                };
                
                setConversations([newConversation]);
                setCurrentConversationId(newConversation.id);
                
                // Navigate to the new conversation URL
                router.visit(`/chat/${newConversation.id}`, { 
                    preserveState: true, 
                    replace: true 
                });
            }
        } catch (error) {
            console.error('Error creating initial conversation:', error);
        }
    };

    const handleConversationSelect = (id: string | number) => {
        setCurrentConversationId(id);
        // Update URL without page reload
        router.visit(`/chat/${id}`, { 
            preserveState: true, 
            replace: true 
        });
    };

    const handleNewConversation = async () => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    title: 'New Chat'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const newConversation: Conversation = {
                    id: data.conversation.id,
                    title: data.conversation.title,
                    messages: []
                };
                
                setConversations(prev => [newConversation, ...prev]);
                setCurrentConversationId(newConversation.id);
                
                // Immediately navigate to the new conversation URL
                router.visit(`/chat/${newConversation.id}`, { 
                    preserveState: true, 
                    replace: true 
                });
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const handleDeleteConversation = async (id: string | number) => {
        try {
            const response = await fetch(`/api/chat/conversations/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            
            if (data.success) {
                setConversations(prev => prev.filter(conv => conv.id !== id));
                if (currentConversationId === id) {
                    const remaining = conversations.filter(conv => conv.id !== id);
                    if (remaining.length > 0) {
                        setCurrentConversationId(remaining[0].id);
                        router.visit(`/chat/${remaining[0].id}`, { 
                            preserveState: true, 
                            replace: true 
                        });
                    } else {
                        setCurrentConversationId('');
                        router.visit('/dashboard', { 
                            preserveState: true, 
                            replace: true 
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleUpdateConversationTitle = async (id: string | number, title: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${id}/title`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ title })
            });

            const data = await response.json();
            
            if (data.success) {
                setConversations(prev => prev.map(conv => 
                    conv.id === id ? { ...conv, title: data.conversation.title } : conv
                ));
            }
        } catch (error) {
            console.error('Error updating conversation title:', error);
        }
    };

    const chatProps = {
        conversations,
        currentConversationId,
        onConversationSelect: handleConversationSelect,
        onNewConversation: handleNewConversation,
        onDeleteConversation: handleDeleteConversation,
        onUpdateConversationTitle: handleUpdateConversationTitle,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} chatProps={chatProps}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col rounded-xl overflow-hidden">
                <ChatInterface 
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onConversationsChange={setConversations}
                    onCurrentConversationChange={setCurrentConversationId}
                />
            </div>
        </AppLayout>
    );
}
