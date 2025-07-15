import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { FileText, Download, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Quiz {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    estimated_time: number;
    questions_count: number;
    total_points: number;
    conversation: {
        id: number;
        title: string;
    };
    created_at: string;
}

interface QuizSidebarProps {
    onQuizDeleted?: () => void;
}

export function QuizSidebar({ onQuizDeleted }: QuizSidebarProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/quizzes');
            const data = await response.json();
            if (data.success) {
                setQuizzes(data.quizzes);
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuizClick = (quiz: Quiz) => {
        router.visit(`/quiz/${quiz.id}`);
    };

    const handleDeleteQuiz = async (e: React.MouseEvent, quiz: Quiz) => {
        e.stopPropagation();
        
        if (!confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/quizzes/${quiz.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
                onQuizDeleted?.();
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const exportQuiz = async (e: React.MouseEvent, quiz: Quiz, format: 'json' | 'yaml') => {
        e.stopPropagation();
        
        try {
            const response = await fetch(`/api/quizzes/${quiz.id}/export/${format}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-${quiz.id}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <SidebarGroup>
            <SidebarGroupLabel>My Quizzes</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {loading ? (
                        <SidebarMenuItem>
                            <div className="p-2 text-sm text-muted-foreground">Loading quizzes...</div>
                        </SidebarMenuItem>
                    ) : quizzes.length === 0 ? (
                        <SidebarMenuItem>
                            <div className="p-2 text-sm text-muted-foreground">No quizzes yet</div>
                        </SidebarMenuItem>
                    ) : (
                        quizzes.map(quiz => (
                            <SidebarMenuItem key={quiz.id}>
                                <div className="flex items-center group">
                                    <SidebarMenuButton
                                        onClick={() => handleQuizClick(quiz)}
                                        className="flex-1 justify-start"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{quiz.title}</div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span className={`px-1 py-0.5 rounded text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                                                    {quiz.difficulty}
                                                </span>
                                                <span>{quiz.questions_count}q</span>
                                                <span>{quiz.estimated_time}min</span>
                                            </div>
                                        </div>
                                    </SidebarMenuButton>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => exportQuiz(e, quiz, 'json')}
                                            className="h-6 w-6 p-0"
                                            title="Export as JSON"
                                        >
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeleteQuiz(e, quiz)}
                                            className="h-6 w-6 p-0 hover:text-red-500"
                                            title="Delete quiz"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </SidebarMenuItem>
                        ))
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}