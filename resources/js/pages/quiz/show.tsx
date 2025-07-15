import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, FileText, Trophy, ArrowLeft, Download, Share2 } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import MultipleChoiceQuestion from '@/components/quiz/multiple-choice-question';
import TrueFalseQuestion from '@/components/quiz/true-false-question';
import ShortAnswerQuestion from '@/components/quiz/short-answer-question';
import EssayQuestion from '@/components/quiz/essay-question';
import FillInBlankQuestion from '@/components/quiz/fill-in-blank-question';
import MatchingQuestion from '@/components/quiz/matching-question';
import OrderingQuestion from '@/components/quiz/ordering-question';
import { useTranslation } from 'react-i18next';

interface Quiz {
    id: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimated_time: number;
    questions_count: number;
    total_points: number;
    questions: any[];
    conversation: {
        id: number;
        title: string;
    };
    created_at: string;
    updated_at: string;
}

interface ShowQuizProps {
    quiz: Quiz;
}

export default function ShowQuiz({ quiz }: ShowQuizProps) {
    const { t } = useTranslation();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [showResults, setShowResults] = useState(false);
    const [startTime] = useState(Date.now());

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Chat',
            href: `/chat/${quiz.conversation.id}`,
        },
        {
            title: quiz.title,
            href: `/quiz/${quiz.id}`,
        },
    ];

    const currentQuestion = quiz.questions[currentQuestionIndex];

    const handleAnswerChange = (questionId: string, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const submitQuiz = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        let totalPoints = 0;
        let earnedPoints = 0;

        quiz.questions.forEach(question => {
            const userAnswer = answers[question.id];
            const questionPoints = question.points || 1;
            totalPoints += questionPoints;

            if (isAnswerCorrect(question, userAnswer)) {
                earnedPoints += questionPoints;
            }
        });

        return {
            totalPoints,
            earnedPoints,
            percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
            correctAnswers: quiz.questions.filter(q => isAnswerCorrect(q, answers[q.id])).length
        };
    };

    const isAnswerCorrect = (question: any, userAnswer: any) => {
        if (!userAnswer) return false;

        switch (question.type) {
            case 'multiple_choice':
                return question.options?.some((option: any) => 
                    option.id === userAnswer && option.is_correct
                );
            
            case 'true_false':
                return userAnswer === question.correct_answer;
            
            case 'short_answer':
                if (!question.correct_answers) return false;
                const normalizedAnswer = question.case_sensitive ? userAnswer : userAnswer.toLowerCase();
                const correctAnswers = question.case_sensitive 
                    ? question.correct_answers 
                    : question.correct_answers.map((a: string) => a.toLowerCase());
                return correctAnswers.includes(normalizedAnswer);
            
            case 'fill_in_blank':
                if (!question.blanks) return false;
                return question.blanks.every((blank: any) => {
                    const userBlankAnswer = userAnswer[blank.id];
                    if (!userBlankAnswer) return false;
                    
                    const normalizedAnswer = blank.case_sensitive ? userBlankAnswer : userBlankAnswer.toLowerCase();
                    const correctAnswers = blank.case_sensitive 
                        ? (blank.correct_answers || [])
                        : (blank.correct_answers || []).map((a: string) => a.toLowerCase());
                    return correctAnswers.includes(normalizedAnswer);
                });
            
            case 'matching':
                if (!question.correct_matches) return false;
                return question.correct_matches.every((match: any) => {
                    return userAnswer[match.left_id] === match.right_id;
                });
            
            case 'ordering':
                if (!question.items || !Array.isArray(userAnswer)) return false;
                return question.items.every((item: any) => {
                    const currentIndex = userAnswer.indexOf(item.id);
                    return currentIndex !== -1 && currentIndex === item.correct_order - 1;
                });
            
            case 'essay':
                // Essays need manual grading, return false for now
                return false;
            
            default:
                return false;
        }
    };

    const exportQuiz = async (format: 'json' | 'yaml') => {
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

    const renderQuestion = () => {
        if (!currentQuestion) return null;

        const questionProps = {
            question: currentQuestion,
            answer: answers[currentQuestion.id],
            onAnswerChange: (answer: any) => handleAnswerChange(currentQuestion.id, answer),
            showResults: showResults,
        };

        switch (currentQuestion.type) {
            case 'multiple_choice':
                return <MultipleChoiceQuestion {...questionProps} />;
            case 'true_false':
                return <TrueFalseQuestion {...questionProps} />;
            case 'short_answer':
                return <ShortAnswerQuestion {...questionProps} />;
            case 'essay':
                return <EssayQuestion {...questionProps} />;
            case 'fill_in_blank':
                return <FillInBlankQuestion {...questionProps} />;
            case 'matching':
                return <MatchingQuestion {...questionProps} />;
            case 'ordering':
                return <OrderingQuestion {...questionProps} />;
            default:
                return <div>Unknown question type: {currentQuestion.type}</div>;
        }
    };

    if (showResults) {
        const score = calculateScore();
        
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Quiz Results - ${quiz.title}`} />
                <div className="max-w-4xl mx-auto p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                {t('quiz.answers.quizComplete')}
                            </CardTitle>
                            <CardDescription>
                                {t('quiz.answers.quizCompleteDescription', { title: quiz.title })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Score Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{score.percentage}%</div>
                                    <div className="text-sm text-muted-foreground">{t('quiz.answers.score')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{score.correctAnswers}/{quiz.questions.length}</div>
                                    <div className="text-sm text-muted-foreground">{t('quiz.answers.correct')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{score.earnedPoints}/{score.totalPoints}</div>
                                    <div className="text-sm text-muted-foreground">{t('quiz.answers.points')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">
                                        {Math.round((Date.now() - startTime) / 60000)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{t('quiz.answers.minutes')}</div>
                                </div>
                            </div>
                            
                            {/* Score Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        score.percentage >= 80 ? 'bg-green-500' :
                                        score.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${score.percentage}%` }}
                                />
                            </div>
                            
                            {/* Performance Message */}
                            <div className="text-center">
                                <div className="text-lg font-medium">
                                    {score.percentage >= 80 ? t('quiz.answers.excellentWork') :
                                     score.percentage >= 60 ? t('quiz.answers.goodJob') : t('quiz.answers.keepPracticing')}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {score.percentage >= 80 ? t('quiz.answers.masteredTopic') :
                                     score.percentage >= 60 ? t('quiz.answers.goodUnderstanding') : t('quiz.answers.reviewMaterial')}
                                </div>
                            </div>
                            
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => setShowResults(false)} variant="outline">
                                    {t('quiz.answers.reviewQuestions')}
                                </Button>
                                <Button asChild>
                                    <Link href={`/chat/${quiz.conversation.id}`}>
                                        {t('quiz.answers.backToChat')}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={quiz.title} />
            <div className="max-w-4xl mx-auto p-6">
                {/* Quiz Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                                <CardDescription className="mt-2">
                                    {quiz.description}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportQuiz('json')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    JSON
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportQuiz('yaml')}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    YAML
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <Badge className={getDifficultyColor(quiz.difficulty)}>
                                    {quiz.difficulty}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {quiz.estimated_time} min
                            </div>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {quiz.questions_count} questions
                            </div>
                            <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                {quiz.total_points} points
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Progress */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium">
                                {t('quiz.answers.questionProgress', { current: currentQuestionIndex + 1, total: quiz.questions.length })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {currentQuestion?.points || 1} {(currentQuestion?.points || 1) > 1 ? t('quiz.answers.pointsPlural') : t('quiz.answers.pointsSingular')}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Question Content */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        {renderQuestion()}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button 
                        variant="outline" 
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        {t('quiz.answers.previous')}
                    </Button>
                    
                    <div className="flex gap-2">
                        {currentQuestionIndex === quiz.questions.length - 1 ? (
                            <Button onClick={submitQuiz}>
                                {t('quiz.answers.submitQuiz')}
                            </Button>
                        ) : (
                            <Button onClick={nextQuestion}>
                                {t('quiz.answers.next')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}