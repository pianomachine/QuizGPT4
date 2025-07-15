import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, FileText } from 'lucide-react';
import TypingAnimation from './typing-animation';
import ThinkingAnimation from './thinking-animation';
import QuizGenerationModal from './quiz-generation-modal';
import { useTranslation } from 'react-i18next';

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

interface ChatInterfaceProps {
    conversations: Conversation[];
    currentConversationId: string | number;
    onConversationsChange: (conversations: Conversation[]) => void;
    onCurrentConversationChange: (id: string | number) => void;
    onNewConversation: () => void;
}

export default function ChatInterface({ 
    conversations, 
    currentConversationId, 
    onConversationsChange, 
    onCurrentConversationChange,
    onNewConversation 
}: ChatInterfaceProps) {
    const { t } = useTranslation();
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentResponseText, setCurrentResponseText] = useState('');
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentConversation = conversations.find(conv => conv.id == currentConversationId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentConversation?.messages]);

    // Reset animation states when conversation changes
    const prevConversationId = useRef<string | number>(currentConversationId);
    
    useEffect(() => {
        const previousId = prevConversationId.current;
        const currentId = currentConversationId;
        
        // Only reset states if we're switching between existing conversations
        // Don't reset if we're going from empty to new conversation (transition flow)
        if (previousId !== '' && currentId !== '' && previousId !== currentId) {
            setIsTyping(false);
            setIsThinking(false);
            setCurrentResponseText('');
            setIsTransitioning(false);
        }
        
        prevConversationId.current = currentConversationId;
    }, [currentConversationId]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const messageToSend = inputMessage;
        setInputMessage('');
        
        // Start transition animation for new conversations
        const isNewConversation = !currentConversationId;
        if (isNewConversation) {
            setIsTransitioning(true);
            // Small delay to show the transition effect
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        setIsThinking(true);

        try {
            // If no current conversation, create one first
            let conversationId = currentConversationId;
            if (!conversationId) {
                const createResponse = await fetch('/api/chat/conversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        title: 'New Chat'
                    })
                });

                const createData = await createResponse.json();
                
                if (createData.success) {
                    conversationId = createData.conversation.id;
                    const newConversation: Conversation = {
                        id: createData.conversation.id,
                        title: createData.conversation.title,
                        messages: []
                    };
                    
                    onConversationsChange(prev => [newConversation, ...prev]);
                    onCurrentConversationChange(conversationId);
                    
                    // Update URL without page reload - more seamless
                    window.history.replaceState({}, '', `/chat/${conversationId}`);
                } else {
                    throw new Error('Failed to create conversation');
                }
            }

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    message: messageToSend,
                    conversation_id: conversationId
                })
            });

            // Check if response is ok
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Authentication/authorization error - redirect to login
                    window.location.href = '/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();

            if (data.success) {
                // Show a warning if this is a fallback response
                if (data.fallback) {
                    console.warn('Using fallback response due to API issue:', data.error_message);
                }

                // Stop thinking animation and start typing animation
                setIsThinking(false);
                setIsTyping(true);
                setCurrentResponseText(data.message.content);

                // Update conversation title if it was changed
                if (data.conversation_title) {
                    const updatedConversations = conversations.map(conv => 
                        conv.id == conversationId 
                            ? { ...conv, title: data.conversation_title }
                            : conv
                    );
                    onConversationsChange(updatedConversations);
                }

                // Refresh conversations after message is sent
                await refreshConversations();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setIsThinking(false);
            setIsTransitioning(false);
        } finally {
            // Reset transition state
            setIsTransitioning(false);
        }
    };

    const refreshConversations = async () => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            // Check if response is ok
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Authentication/authorization error - redirect to login
                    window.location.href = '/login';
                    return;
                } else if (response.status === 500) {
                    // Server error - show error message
                    console.error('Server error refreshing conversations');
                    return;
                }
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON:', await response.text());
                return;
            }

            const data = await response.json();
            
            if (data.success && data.conversations) {
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
                
                onConversationsChange(formattedConversations);
            }
        } catch (error) {
            console.error('Error refreshing conversations:', error);
        }
    };

    const handleTypingComplete = () => {
        setIsTyping(false);
        setCurrentResponseText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };


    return (
        <div className="flex h-full bg-background">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Hidden Quiz Generation Button for data attribute */}
                <Button
                    data-quiz-modal-trigger
                    onClick={() => setShowQuizModal(true)}
                    style={{ display: 'none' }}
                >
                    {t('chat.generateQuiz')}
                </Button>
                
                {/* Messages or Center Input */}
                {currentConversation?.messages.length > 0 && !isTransitioning ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {currentConversation?.messages.map((message, index) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        {message.role === 'assistant' && (
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarFallback>
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        
                                        <div
                                            className={`max-w-[85%] rounded-lg p-3 ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">
                                                {message.role === 'assistant' && 
                                                 index === currentConversation.messages.length - 1 && 
                                                 isTyping && 
                                                 currentResponseText ? (
                                                    <TypingAnimation 
                                                        text={currentResponseText} 
                                                        onComplete={handleTypingComplete} 
                                                    />
                                                ) : (
                                                    message.content
                                                )}
                                            </p>
                                            <span className="text-xs opacity-70 mt-1 block">
                                                {message.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        
                                        {message.role === 'user' && (
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                
                                {isThinking && <ThinkingAnimation />}
                                
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area - Bottom Position */}
                        <div className="border-t border-sidebar-border/70 dark:border-sidebar-border p-4 animate-slide-down">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={isThinking ? t('common.loading') : isTyping ? t('common.loading') : t('chat.typeMessage')}
                                        className="flex-1"
                                        disabled={isThinking || isTyping}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isThinking || isTyping}
                                        size="icon"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Center Input for New Chat or Transitioning */
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="w-full max-w-2xl space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-2">
                                    {isTransitioning ? t('chat.startingConversation') : t('chat.startConversation')}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isTransitioning ? "Please wait while we set up your chat" : "Ask me anything to get started"}
                                </p>
                            </div>
                            <div className={`flex gap-2 ${isTransitioning ? 'animate-slide-down' : 'animate-fade-in'}`}>
                                <Input
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={isTransitioning ? t('common.loading') : t('chat.typeMessage')}
                                    className="flex-1"
                                    disabled={isThinking || isTyping || isTransitioning}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isThinking || isTyping || isTransitioning}
                                    size="icon"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            {isTransitioning && (
                                <div className="text-center">
                                    <ThinkingAnimation />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Quiz Generation Modal */}
            {showQuizModal && (
                <QuizGenerationModal
                    conversationId={currentConversationId}
                    onClose={() => setShowQuizModal(false)}
                />
            )}
        </div>
    );
}