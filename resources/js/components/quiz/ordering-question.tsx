import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Check, X } from 'lucide-react';

interface OrderingItem {
    id: string;
    text: string;
    correct_order: number;
}

interface OrderingQuestionProps {
    question: {
        id: string;
        question: string;
        items: OrderingItem[];
        explanation?: string;
        points: number;
    };
    answer: string[] | null;
    onAnswerChange: (answer: string[]) => void;
    showResults: boolean;
}

export default function OrderingQuestion({
    question,
    answer,
    onAnswerChange,
    showResults
}: OrderingQuestionProps) {
    const [orderedItems, setOrderedItems] = useState<string[]>([]);

    useEffect(() => {
        if (answer) {
            setOrderedItems(answer);
        } else {
            // Initialize with shuffled items
            const shuffled = [...question.items]
                .sort(() => Math.random() - 0.5)
                .map(item => item.id);
            setOrderedItems(shuffled);
            onAnswerChange(shuffled);
        }
    }, []);

    const moveItem = (fromIndex: number, toIndex: number) => {
        if (showResults) return;
        
        const newOrder = [...orderedItems];
        const [movedItem] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, movedItem);
        
        setOrderedItems(newOrder);
        onAnswerChange(newOrder);
    };

    const moveUp = (index: number) => {
        if (index > 0) {
            moveItem(index, index - 1);
        }
    };

    const moveDown = (index: number) => {
        if (index < orderedItems.length - 1) {
            moveItem(index, index + 1);
        }
    };

    const isItemCorrect = (itemId: string, currentPosition: number) => {
        const item = question.items.find(i => i.id === itemId);
        return item ? item.correct_order === currentPosition + 1 : false;
    };

    const getItemClass = (itemId: string, currentPosition: number) => {
        if (!showResults) {
            return 'hover:bg-gray-50 dark:hover:bg-gray-800';
        }

        if (isItemCorrect(itemId, currentPosition)) {
            return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
        } else {
            return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        }
    };

    const getItemIcon = (itemId: string, currentPosition: number) => {
        if (!showResults) return null;
        
        if (isItemCorrect(itemId, currentPosition)) {
            return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
        } else {
            return <X className="h-4 w-4 text-red-600 dark:text-red-400" />;
        }
    };

    const getItemText = (itemId: string) => {
        const item = question.items.find(i => i.id === itemId);
        return item ? item.text : '';
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">{question.question}</h3>
            
            <div className="space-y-2">
                {orderedItems.map((itemId, index) => (
                    <Card
                        key={itemId}
                        className={`transition-colors ${getItemClass(itemId, index)}`}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium w-6">
                                        {index + 1}.
                                    </span>
                                    <span className="text-sm">{getItemText(itemId)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getItemIcon(itemId, index)}
                                    {!showResults && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => moveUp(index)}
                                                disabled={index === 0}
                                                className="h-6 w-6 p-0"
                                            >
                                                <ArrowUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => moveDown(index)}
                                                disabled={index === orderedItems.length - 1}
                                                className="h-6 w-6 p-0"
                                            >
                                                <ArrowDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {showResults && (
                <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Correct Order:</h4>
                        <div className="space-y-1">
                            {question.items
                                .sort((a, b) => a.correct_order - b.correct_order)
                                .map((item, index) => (
                                    <div key={item.id} className="text-sm">
                                        <strong>{index + 1}.</strong> {item.text}
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