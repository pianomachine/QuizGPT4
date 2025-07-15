import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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

    const getQuestionTypeLabel = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'multiple_choice': 'multipleChoice',
            'true_false': 'trueFalse',
            'short_answer': 'shortAnswer',
            'essay': 'essay',
            'fill_in_blank': 'fillInBlank',
            'matching': 'matching',
            'ordering': 'ordering'
        };
        return t(`quiz.questionType.${typeMap[type] || type}`);
    };

    const getQuestionTypeDescription = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'multiple_choice': 'multipleChoice',
            'true_false': 'trueFalse',
            'short_answer': 'shortAnswer',
            'essay': 'essay',
            'fill_in_blank': 'fillInBlank',
            'matching': 'matching',
            'ordering': 'ordering'
        };
        return t(`quiz.questionTypeDescription.${typeMap[type] || type}`);
    };

    const generateQuiz = async () => {
        if (selectedQuestionTypes.length === 0) {
            setError(t('quiz.errors.selectQuestionType'));
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
                setError(data.error || t('quiz.errors.generateFailed'));
            }
        } catch (error) {
            setError(t('quiz.errors.generateFailed'));
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
                    <DialogTitle>{t('quiz.generateFromConversation')}</DialogTitle>
                    <DialogDescription>
                        {t('quiz.generateQuizDescription')}
                    </DialogDescription>
                </DialogHeader>

                {!generatedQuiz ? (
                    <div className="space-y-6">
                        {/* Question Count */}
                        <div className="space-y-2">
                            <Label htmlFor="question-count">{t('quiz.questionCount')}</Label>
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
                            <Label htmlFor="difficulty">{t('quiz.difficulty')}</Label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('quiz.difficulty')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">{t('quiz.difficulty.easy')}</SelectItem>
                                    <SelectItem value="medium">{t('quiz.difficulty.medium')}</SelectItem>
                                    <SelectItem value="hard">{t('quiz.difficulty.hard')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <Label htmlFor="language">{t('quiz.language')}</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('quiz.language')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Japanese">{t('quiz.language.japanese')}</SelectItem>
                                    <SelectItem value="English">{t('quiz.language.english')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Question Types */}
                        <div className="space-y-2">
                            <Label>{t('quiz.questionTypes')}</Label>
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
                                                {getQuestionTypeLabel(type.value)}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {getQuestionTypeDescription(type.value)}
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
                                {t('common.cancel')}
                            </Button>
                            <Button 
                                onClick={generateQuiz} 
                                disabled={isGenerating || selectedQuestionTypes.length === 0}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('quiz.generating')}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        {t('quiz.generateQuiz')}
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
                                        <span className="font-medium">{t('quiz.difficulty')}:</span> {generatedQuiz.difficulty}
                                    </div>
                                    <div>
                                        <span className="font-medium">{t('quiz.questions')}:</span> {generatedQuiz.questions_count}
                                    </div>
                                    <div>
                                        <span className="font-medium">{t('quiz.estimatedTime')}:</span> {generatedQuiz.estimated_time} {t('quiz.minutes')}
                                    </div>
                                    <div>
                                        <span className="font-medium">{t('quiz.points')}:</span> {generatedQuiz.total_points}
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
                                    {t('quiz.exportJson')}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => exportQuiz('yaml')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {t('quiz.exportYaml')}
                                </Button>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={onClose}>
                                    {t('common.close')}
                                </Button>
                                <Button onClick={viewQuiz}>
                                    {t('quiz.viewQuiz')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}