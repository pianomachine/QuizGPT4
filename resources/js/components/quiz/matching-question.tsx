import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface LeftItem {
    id: string;
    text: string;
}

interface RightItem {
    id: string;
    text: string;
}

interface CorrectMatch {
    left_id: string;
    right_id: string;
}

interface MatchingQuestionProps {
    question: {
        id: string;
        question: string;
        left_items: LeftItem[];
        right_items: RightItem[];
        correct_matches: CorrectMatch[];
        explanation?: string;
        points: number;
    };
    answer: Record<string, string> | null;
    onAnswerChange: (answer: Record<string, string>) => void;
    showResults: boolean;
}

export default function MatchingQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: MatchingQuestionProps) {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);

    const handleLeftClick = (leftId: string) => {
        if (showResults) return;
        setSelectedLeft(leftId);
        if (selectedRight) {
            makeMatch(leftId, selectedRight);
        }
    };

    const handleRightClick = (rightId: string) => {
        if (showResults) return;
        setSelectedRight(rightId);
        if (selectedLeft) {
            makeMatch(selectedLeft, rightId);
        }
    };

    const makeMatch = (leftId: string, rightId: string) => {
        const newAnswer = { ...answer, [leftId]: rightId };
        onAnswerChange(newAnswer);
        setSelectedLeft(null);
        setSelectedRight(null);
    };

    const clearMatch = (leftId: string) => {
        if (showResults) return;
        const newAnswer = { ...answer };
        delete newAnswer[leftId];
        onAnswerChange(newAnswer);
    };

    const isMatchCorrect = (leftId: string) => {
        if (!answer || !answer[leftId]) return null;
        
        const correctMatch = question.correct_matches.find(match => match.left_id === leftId);
        return correctMatch?.right_id === answer[leftId];
    };

    const getLeftItemClass = (leftId: string) => {
        if (!showResults) {
            return selectedLeft === leftId 
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800';
        }

        const isCorrect = isMatchCorrect(leftId);
        if (isCorrect === true) {
            return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
        } else if (isCorrect === false) {
            return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        }
        return 'bg-gray-50 dark:bg-gray-800';
    };

    const getRightItemClass = (rightId: string) => {
        if (!showResults) {
            return selectedRight === rightId 
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800';
        }

        const isUsed = answer && Object.values(answer).includes(rightId);
        return isUsed ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800';
    };

    const getMatchIcon = (leftId: string) => {
        if (!showResults) return null;
        
        const isCorrect = isMatchCorrect(leftId);
        if (isCorrect === true) {
            return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
        } else if (isCorrect === false) {
            return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Items */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Items to Match</h4>
                    {question.left_items.map((item) => (
                        <Card
                            key={item.id}
                            className={`cursor-pointer transition-colors ${getLeftItemClass(item.id)}`}
                            onClick={() => handleLeftClick(item.id)}
                        >
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{item.text}</span>
                                    <div className="flex items-center gap-2">
                                        {answer && answer[item.id] && (
                                            <span className="text-xs text-muted-foreground">
                                                → {question.right_items.find(r => r.id === answer[item.id])?.text}
                                            </span>
                                        )}
                                        {getMatchIcon(item.id)}
                                        {!showResults && answer && answer[item.id] && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearMatch(item.id);
                                                }}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Right Items */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Matches</h4>
                    {question.right_items.map((item) => (
                        <Card
                            key={item.id}
                            className={`cursor-pointer transition-colors ${getRightItemClass(item.id)}`}
                            onClick={() => handleRightClick(item.id)}
                        >
                            <CardContent className="p-3">
                                <span className="text-sm">{item.text}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {showResults && (
                <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Correct Matches:</h4>
                        <div className="space-y-1">
                            {question.correct_matches.map((match) => {
                                const leftItem = question.left_items.find(item => item.id === match.left_id);
                                const rightItem = question.right_items.find(item => item.id === match.right_id);
                                return (
                                    <div key={match.left_id} className="text-sm">
                                        <strong>{leftItem?.text}</strong> → {rightItem?.text}
                                    </div>
                                );
                            })}
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