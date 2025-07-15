import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, FileText, Trophy, Search, Download, Trash2, Plus } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Quiz {
    id: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_time: number;
    questions_count: number;
    total_points: number;
    conversation: {
        id: number;
        title: string;
    };
    created_at: string;
    updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Quizzes',
        href: '/quizzes',
    },
];

export default function QuizIndex() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');

    useEffect(() => {
        loadQuizzes();
    }, []);

    useEffect(() => {
        filterQuizzes();
    }, [quizzes, searchTerm, difficultyFilter]);

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

    const filterQuizzes = () => {
        let filtered = quizzes;

        if (searchTerm) {
            filtered = filtered.filter(quiz =>
                quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(quiz => quiz.difficulty === difficultyFilter);
        }

        setFilteredQuizzes(filtered);
    };

    const handleDeleteQuiz = async (quiz: Quiz) => {
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
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const exportQuiz = async (quiz: Quiz, format: 'json' | 'yaml') => {
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Quizzes" />
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">My Quizzes</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your generated quizzes from conversations
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Quiz
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search quizzes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Difficulties</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Quiz Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm || difficultyFilter !== 'all' 
                                    ? 'No quizzes match your current filters.'
                                    : 'Start by creating your first quiz from a conversation.'
                                }
                            </p>
                            <Button asChild>
                                <Link href="/dashboard">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Quiz
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz) => (
                            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg line-clamp-2">
                                                {quiz.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {quiz.description || 'No description'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => exportQuiz(quiz, 'json')}
                                                className="h-8 w-8 p-0"
                                                title="Export as JSON"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteQuiz(quiz)}
                                                className="h-8 w-8 p-0 hover:text-red-500"
                                                title="Delete quiz"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                                                {quiz.difficulty}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {quiz.estimated_time} min
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {quiz.questions_count} questions
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Trophy className="h-3 w-3" />
                                                {quiz.total_points} points
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-muted-foreground">
                                            From: <Link 
                                                href={`/chat/${quiz.conversation.id}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {quiz.conversation.title}
                                            </Link>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button asChild className="flex-1">
                                                <Link href={`/quiz/${quiz.id}`}>
                                                    Take Quiz
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}