import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EssayQuestionProps {
    question: {
        id: string;
        question: string;
        sample_answer?: string;
        grading_criteria?: Array<{
            criterion: string;
            points: number;
        }>;
        min_words?: number;
        max_words?: number;
        points: number;
    };
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showResults: boolean;
}

export default function EssayQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: EssayQuestionProps) {
    const getWordCount = () => {
        if (!answer) return 0;
        return answer.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const getWordCountColor = () => {
        const count = getWordCount();
        if (question.min_words && count < question.min_words) {
            return 'text-red-500';
        }
        if (question.max_words && count > question.max_words) {
            return 'text-red-500';
        }
        return 'text-gray-500';
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            {(question.min_words || question.max_words) && (
                <div className="flex items-center gap-2 text-sm">
                    <span>Word count requirements:</span>
                    {question.min_words && (
                        <Badge variant="outline">Min: {question.min_words}</Badge>
                    )}
                    {question.max_words && (
                        <Badge variant="outline">Max: {question.max_words}</Badge>
                    )}
                </div>
            )}
            
            <div className="space-y-3">
                <div className="relative">
                    <textarea
                        value={answer || ''}
                        onChange={(e) => onAnswerChange(e.target.value)}
                        placeholder="Enter your essay response..."
                        disabled={showResults}
                        className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${getWordCountColor()}`}>
                        {getWordCount()} words
                    </div>
                </div>
            </div>

            {showResults && question.grading_criteria && (
                <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Grading Criteria:</h4>
                        <div className="space-y-1">
                            {question.grading_criteria.map((criterion, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{criterion.criterion}</span>
                                    <span>{criterion.points} points</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {showResults && question.sample_answer && (
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Sample Answer:</h4>
                        <p className="text-sm">{question.sample_answer}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}