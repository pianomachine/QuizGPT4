<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quiz extends Model
{
    protected $fillable = [
        'title',
        'description',
        'conversation_id',
        'user_id',
        'difficulty',
        'estimated_time',
        'questions',
        'metadata',
    ];

    protected $casts = [
        'questions' => 'array',
        'metadata' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getQuestionsCount(): int
    {
        return count($this->questions ?? []);
    }

    public function getTotalPoints(): int
    {
        if (!$this->questions) {
            return 0;
        }

        return array_sum(array_column($this->questions, 'points'));
    }

    public function getQuestionsByType(string $type): array
    {
        if (!$this->questions) {
            return [];
        }

        return array_filter($this->questions, function ($question) use ($type) {
            return $question['type'] === $type;
        });
    }
}
