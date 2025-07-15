import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface TrueFalseQuestionProps {
    question: {
        id: string;
        question: string;
        correct_answer: boolean;
        explanation?: string;
        points: number;
    };
    answer: boolean | null;
    onAnswerChange: (answer: boolean) => void;
    showResults: boolean;
}

export default function TrueFalseQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: TrueFalseQuestionProps) {
    const getOptionClass = (value: boolean) => {
        if (!showResults) {
            return answer === value 
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer';
        }

        if (value === question.correct_answer) {
            return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
        }

        if (answer === value && value !== question.correct_answer) {
            return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        }

        return 'bg-gray-50 dark:bg-gray-800';
    };

    const getOptionIcon = (value: boolean) => {
        if (!showResults) return null;

        if (value === question.correct_answer) {
            return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
        }

        if (answer === value && value !== question.correct_answer) {
            return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
        }

        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            <div className="space-y-3">
                <Card 
                    className={`cursor-pointer transition-colors ${getOptionClass(true)}`}
                    onClick={() => !showResults && onAnswerChange(true)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="flex-1">True</span>
                            {getOptionIcon(true)}
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={`cursor-pointer transition-colors ${getOptionClass(false)}`}
                    onClick={() => !showResults && onAnswerChange(false)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="flex-1">False</span>
                            {getOptionIcon(false)}
                        </div>
                    </CardContent>
                </Card>
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