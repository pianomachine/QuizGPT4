import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface Option {
    id: string;
    text: string;
    is_correct: boolean;
}

interface MultipleChoiceQuestionProps {
    question: {
        id: string;
        question: string;
        options: Option[];
        explanation?: string;
        points: number;
    };
    answer: string | null;
    onAnswerChange: (answer: string) => void;
    showResults: boolean;
}

export default function MultipleChoiceQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: MultipleChoiceQuestionProps) {
    const getOptionClass = (option: Option) => {
        if (!showResults) {
            return answer === option.id 
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer';
        }

        if (option.is_correct) {
            return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
        }

        if (answer === option.id && !option.is_correct) {
            return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        }

        return 'bg-gray-50 dark:bg-gray-800';
    };

    const getOptionIcon = (option: Option) => {
        if (!showResults) return null;

        if (option.is_correct) {
            return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
        }

        if (answer === option.id && !option.is_correct) {
            return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
        }

        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            <div className="space-y-3">
                {(question.options || []).map((option) => (
                    <Card 
                        key={option.id} 
                        className={`cursor-pointer transition-colors ${getOptionClass(option)}`}
                        onClick={() => !showResults && onAnswerChange(option.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="flex-1">{option.text}</span>
                                {getOptionIcon(option)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
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