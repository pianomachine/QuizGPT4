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

    const handleNewConversation = () => {
        // Simply set current conversation to empty and navigate to dashboard
        setCurrentConversationId('');
        router.visit('/dashboard', { 
            preserveState: true, 
            replace: true 
        });
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

    const currentConversation = conversations.find(conv => conv.id == currentConversationId);

    return (
        <AppLayout chatProps={chatProps}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col">
                {/* Conversation Title Header - Topmost Element */}
                {currentConversation && currentConversation.messages.length > 1 && (
                    <div className="border-b border-sidebar-border/70 dark:border-sidebar-border p-4 bg-background">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">
                                {currentConversation.title}
                            </h2>
                            <button
                                onClick={() => {
                                    const chatInterface = document.querySelector('[data-quiz-modal-trigger]');
                                    if (chatInterface) {
                                        (chatInterface as HTMLElement).click();
                                    }
                                }}
                                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 has-[>svg]:px-2.5 gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text h-4 w-4">
                                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                    <path d="M10 9H8"></path>
                                    <path d="M16 13H8"></path>
                                    <path d="M16 17H8"></path>
                                </svg>
                                Generate Quiz
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex-1 rounded-xl overflow-hidden">
                    <ChatInterface 
                        conversations={conversations}
                        currentConversationId={currentConversationId}
                        onConversationsChange={setConversations}
                        onCurrentConversationChange={setCurrentConversationId}
                        onNewConversation={handleNewConversation}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
