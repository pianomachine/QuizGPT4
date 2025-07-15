import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Download } from 'lucide-react';
import { router } from '@inertiajs/react';

interface QuestionType {
    value: string;
    label: string;
    description: string;
}

interface QuizGenerationModalProps {
    conversationId: string | number;
    onClose: () => void;
}

interface Quiz {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    estimated_time: number;
    questions_count: number;
    total_points: number;
    questions: any[];
    created_at: string;
}

export default function QuizGenerationModal({ conversationId, onClose }: QuizGenerationModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple_choice', 'true_false', 'short_answer']);
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState('medium');
    const [language, setLanguage] = useState('Japanese');
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestionTypes();
    }, []);

    const fetchQuestionTypes = async () => {
        try {
            const response = await fetch('/api/quiz/question-types');
            const data = await response.json();
            if (data.success) {
                setQuestionTypes(data.question_types);
            }
        } catch (error) {
            console.error('Error fetching question types:', error);
        }
    };

    const handleQuestionTypeToggle = (type: string) => {
        setSelectedQuestionTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const generateQuiz = async () => {
        if (selectedQuestionTypes.length === 0) {
            setError('Please select at least one question type');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch(`/api/conversations/${conversationId}/generate-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    question_count: questionCount,
                    difficulty: difficulty,
                    question_types: selectedQuestionTypes,
                    language: language,
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setGeneratedQuiz(data.quiz);
            } else {
                setError(data.error || 'Failed to generate quiz');
            }
        } catch (error) {
            setError('An error occurred while generating the quiz');
            console.error('Quiz generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const viewQuiz = () => {
        if (generatedQuiz) {
            router.visit(`/quiz/${generatedQuiz.id}`);
        }
    };

    const exportQuiz = async (format: 'json' | 'yaml') => {
        if (!generatedQuiz) return;

        try {
            const response = await fetch(`/api/quizzes/${generatedQuiz.id}/export/${format}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-${generatedQuiz.id}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Quiz from Conversation</DialogTitle>
                    <DialogDescription>
                        Create a quiz based on the content of this conversation
                    </DialogDescription>
                </DialogHeader>

                {!generatedQuiz ? (
                    <div className="space-y-6">
                        {/* Question Count */}
                        <div className="space-y-2">
                            <Label htmlFor="question-count">Number of Questions</Label>
                            <Input
                                id="question-count"
                                type="number"
                                min="1"
                                max="20"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                placeholder="5"
                            />
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Japanese">Japanese (日本語)</SelectItem>
                                    <SelectItem value="English">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Question Types */}
                        <div className="space-y-2">
                            <Label>Question Types</Label>
                            <div className="grid grid-cols-1 gap-3">
                                {questionTypes.map((type) => (
                                    <div key={type.value} className="flex items-start space-x-2">
                                        <Checkbox
                                            id={type.value}
                                            checked={selectedQuestionTypes.includes(type.value)}
                                            onCheckedChange={() => handleQuestionTypeToggle(type.value)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label 
                                                htmlFor={type.value}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {type.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={generateQuiz} 
                                disabled={isGenerating || selectedQuestionTypes.length === 0}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Generate Quiz
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{generatedQuiz.title}</CardTitle>
                                <CardDescription>{generatedQuiz.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Difficulty:</span> {generatedQuiz.difficulty}
                                    </div>
                                    <div>
                                        <span className="font-medium">Questions:</span> {generatedQuiz.questions_count}
                                    </div>
                                    <div>
                                        <span className="font-medium">Estimated Time:</span> {generatedQuiz.estimated_time} min
                                    </div>
                                    <div>
                                        <span className="font-medium">Total Points:</span> {generatedQuiz.total_points}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <div className="flex space-x-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => exportQuiz('json')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export JSON
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => exportQuiz('yaml')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export YAML
                                </Button>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                                <Button onClick={viewQuiz}>
                                    View Quiz
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}