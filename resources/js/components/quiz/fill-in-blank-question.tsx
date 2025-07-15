import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface Blank {
    id: string;
    position: number;
    correct_answers: string[];
    case_sensitive?: boolean;
}

interface FillInBlankQuestionProps {
    question: {
        id: string;
        question: string;
        blanks: Blank[];
        explanation?: string;
        points: number;
    };
    answer: Record<string, string> | null;
    onAnswerChange: (answer: Record<string, string>) => void;
    showResults: boolean;
}

export default function FillInBlankQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: FillInBlankQuestionProps) {
    const handleBlankChange = (blankId: string, value: string) => {
        const newAnswer = { ...answer, [blankId]: value };
        onAnswerChange(newAnswer);
    };

    const isBlankCorrect = (blank: Blank) => {
        if (!answer || !answer[blank.id]) return false;
        
        const userAnswer = blank.case_sensitive ? answer[blank.id] : answer[blank.id].toLowerCase();
        const correctAnswers = blank.case_sensitive 
            ? blank.correct_answers 
            : blank.correct_answers.map(a => a.toLowerCase());
        
        return correctAnswers.includes(userAnswer);
    };

    const getInputClass = (blank: Blank) => {
        if (!showResults) return '';
        
        if (isBlankCorrect(blank)) {
            return 'border-green-500 bg-green-50 dark:bg-green-900/20';
        } else {
            return 'border-red-500 bg-red-50 dark:bg-red-900/20';
        }
    };

    const renderQuestionWithBlanks = () => {
        const parts = question.question.split('{blank}');
        const result = [];
        
        for (let i = 0; i < parts.length; i++) {
            result.push(
                <span key={`text-${i}`}>{parts[i]}</span>
            );
            
            if (i < parts.length - 1) {
                const blank = question.blanks[i];
                if (blank) {
                    result.push(
                        <span key={`blank-${i}`} className="relative inline-block">
                            <Input
                                type="text"
                                value={answer?.[blank.id] || ''}
                                onChange={(e) => handleBlankChange(blank.id, e.target.value)}
                                placeholder="..."
                                disabled={showResults}
                                className={`w-24 mx-1 inline-block ${getInputClass(blank)}`}
                            />
                            {showResults && (
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    {isBlankCorrect(blank) ? (
                                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    )}
                                </span>
                            )}
                        </span>
                    );
                }
            }
        }
        
        return result;
    };

    return (
        <div className="space-y-4">
            <div className="text-lg font-medium">
                {renderQuestionWithBlanks()}
            </div>

            {showResults && (
                <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Correct Answers:</h4>
                        <div className="space-y-1">
                            {question.blanks.map((blank, index) => (
                                <div key={blank.id} className="text-sm">
                                    <strong>Blank {index + 1}:</strong> {blank.correct_answers.join(', ')}
                                    {!blank.case_sensitive && (
                                        <span className="text-muted-foreground ml-2">(Case insensitive)</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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