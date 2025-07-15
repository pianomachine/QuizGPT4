import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export default function ThinkingAnimation() {
    return (
        <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                    <Bot className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-4 max-w-xs">
                <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm text-muted-foreground animate-pulse">AI is thinking...</span>
                </div>
                <div className="mt-2 space-y-1">
                    <div className="h-2 bg-muted-foreground/20 rounded animate-pulse"></div>
                    <div className="h-2 bg-muted-foreground/20 rounded animate-pulse w-3/4"></div>
                </div>
            </div>
        </div>
    );
}