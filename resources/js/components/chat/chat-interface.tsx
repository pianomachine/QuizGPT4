import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot } from 'lucide-react';
import TypingAnimation from './typing-animation';
import ThinkingAnimation from './thinking-animation';

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
}

export default function ChatInterface({ 
    conversations, 
    currentConversationId, 
    onConversationsChange, 
    onCurrentConversationChange 
}: ChatInterfaceProps) {
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentResponseText, setCurrentResponseText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentConversation = conversations.find(conv => conv.id == currentConversationId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentConversation?.messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const messageToSend = inputMessage;
        setInputMessage('');
        setIsThinking(true);

        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    message: messageToSend,
                    conversation_id: currentConversationId
                })
            });

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

                // Refresh conversations after message is sent
                await refreshConversations();
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setIsThinking(false);
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
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                className={`max-w-[70%] rounded-lg p-3 ${
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

                {/* Input Area */}
                <div className="border-t border-sidebar-border/70 dark:border-sidebar-border p-4">
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isThinking ? "AI is thinking..." : isTyping ? "AI is typing..." : "Type your message..."}
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
        </div>
    );
}