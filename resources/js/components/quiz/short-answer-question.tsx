import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface ShortAnswerQuestionProps {
    question: {
        id: string;
        question: string;
        correct_answers: string[];
        case_sensitive?: boolean;
        explanation?: string;
        points: number;
    };
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showResults: boolean;
}

export default function ShortAnswerQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: ShortAnswerQuestionProps) {
    const isCorrect = () => {
        if (!answer) return false;
        
        const userAnswer = question.case_sensitive ? answer : answer.toLowerCase();
        const correctAnswers = question.case_sensitive 
            ? question.correct_answers 
            : question.correct_answers.map(a => a.toLowerCase());
        
        return correctAnswers.includes(userAnswer);
    };

    const getInputClass = () => {
        if (!showResults) return '';
        
        if (isCorrect()) {
            return 'border-green-500 bg-green-50 dark:bg-green-900/20';
        } else {
            return 'border-red-500 bg-red-50 dark:bg-red-900/20';
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            <div className="space-y-3">
                <div className="relative">
                    <Input
                        type="text"
                        value={answer || ''}
                        onChange={(e) => onAnswerChange(e.target.value)}
                        placeholder="Enter your answer"
                        disabled={showResults}
                        className={getInputClass()}
                    />
                    {showResults && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            {isCorrect() ? (
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                    )}
                </div>

                {showResults && (
                    <Card className="bg-gray-50 dark:bg-gray-800">
                        <CardContent className="p-4">
                            <p className="text-sm">
                                <strong>Correct answers:</strong> {question.correct_answers.join(', ')}
                            </p>
                            {!question.case_sensitive && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    (Case insensitive)
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {showResults && question.explanation && (
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <CardContent className="p-4">
                        <p className="text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}