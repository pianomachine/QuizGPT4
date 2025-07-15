<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Quiz;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class QuizGenerator
{
    private array $questionTypes = [
        'multiple_choice',
        'true_false',
        'short_answer',
        'essay',
        'fill_in_blank',
        'matching',
        'ordering'
    ];

    public function generateQuizFromConversation(Conversation $conversation, array $options = []): Quiz
    {
        $conversationText = $this->extractConversationText($conversation);
        $quizData = $this->generateQuizData($conversationText, $options);
        
        return Quiz::create([
            'title' => $quizData['title'],
            'description' => $quizData['description'],
            'conversation_id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'difficulty' => $quizData['difficulty'],
            'estimated_time' => $this->estimateTime($quizData['questions']),
            'questions' => $quizData['questions'],
            'metadata' => [
                'generated_at' => now(),
                'source_messages_count' => $conversation->messages()->count(),
                'generation_options' => $options,
            ],
        ]);
    }

    private function extractConversationText(Conversation $conversation): string
    {
        $messages = $conversation->messages()->orderBy('created_at', 'asc')->get();
        
        $conversationText = '';
        foreach ($messages as $message) {
            $role = $message->role === 'user' ? 'User' : 'Assistant';
            $conversationText .= "{$role}: {$message->content}\n\n";
        }
        
        return $conversationText;
    }

    private function generateQuizData(string $conversationText, array $options = []): array
    {
        $questionCount = $options['question_count'] ?? 5;
        $difficulty = $options['difficulty'] ?? 'medium';
        $questionTypes = $options['question_types'] ?? ['multiple_choice', 'true_false', 'short_answer'];
        $language = $options['language'] ?? 'Japanese';
        
        $prompt = $this->buildPrompt($conversationText, $questionCount, $difficulty, $questionTypes, $language);
        
        try {
            $response = $this->callOpenAI($prompt);
            return $this->parseAIResponse($response);
        } catch (\Exception $e) {
            Log::error('Quiz generation failed', ['error' => $e->getMessage()]);
            return $this->generateFallbackQuiz($conversationText, $questionCount, $difficulty);
        }
    }

    private function buildPrompt(string $conversationText, int $questionCount, string $difficulty, array $questionTypes, string $language = 'Japanese'): string
    {
        $typesString = implode(', ', $questionTypes);
        
        $languageInstruction = $language === 'Japanese' 
            ? 'Generate all questions, options, and explanations in Japanese language.'
            : 'Generate all questions, options, and explanations in English language.';
        
        return "Based on the following conversation, generate a quiz with {$questionCount} questions of {$difficulty} difficulty.

Use these question types: {$typesString}

{$languageInstruction}

Conversation:
{$conversationText}

Generate a JSON response with the following structure:
{
    \"title\": \"Quiz title based on conversation topic\",
    \"description\": \"Brief description of what the quiz covers\",
    \"difficulty\": \"{$difficulty}\",
    \"questions\": [
        {
            \"id\": \"q1\",
            \"type\": \"multiple_choice\",
            \"question\": \"Question text\",
            \"options\": [
                {\"id\": \"a\", \"text\": \"Option A\", \"is_correct\": true},
                {\"id\": \"b\", \"text\": \"Option B\", \"is_correct\": false},
                {\"id\": \"c\", \"text\": \"Option C\", \"is_correct\": false},
                {\"id\": \"d\", \"text\": \"Option D\", \"is_correct\": false}
            ],
            \"explanation\": \"Explanation of the correct answer\",
            \"points\": 1
        },
        {
            \"id\": \"q2\",
            \"type\": \"true_false\",
            \"question\": \"Question text\",
            \"correct_answer\": true,
            \"explanation\": \"Explanation\",
            \"points\": 1
        },
        {
            \"id\": \"q3\",
            \"type\": \"short_answer\",
            \"question\": \"Question text\",
            \"correct_answers\": [\"answer1\", \"answer2\"],
            \"case_sensitive\": false,
            \"explanation\": \"Explanation\",
            \"points\": 1
        }
    ]
}

Make sure all questions are directly related to the conversation content and test understanding of the topics discussed.";
    }

    private function callOpenAI(string $prompt): string
    {
        $apiKey = env('OPENAI_API_KEY');
        
        if (!$apiKey) {
            throw new \Exception('OpenAI API key is not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a helpful assistant that creates educational quizzes from conversations. Always respond with valid JSON only.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'max_tokens' => 2000,
            'temperature' => 0.7,
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API request failed: ' . $response->body());
        }

        $data = $response->json();
        
        if (!isset($data['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid response format from OpenAI');
        }

        return $data['choices'][0]['message']['content'];
    }

    private function parseAIResponse(string $response): array
    {
        // Clean up response to extract JSON
        $response = trim($response);
        $response = preg_replace('/```json\n?/', '', $response);
        $response = preg_replace('/\n?```/', '', $response);
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON response from AI: ' . json_last_error_msg());
        }

        // Validate required fields
        if (!isset($data['title'], $data['questions'])) {
            throw new \Exception('Missing required fields in AI response');
        }

        // Add IDs to questions if missing
        foreach ($data['questions'] as &$question) {
            if (!isset($question['id'])) {
                $question['id'] = 'q' . Str::random(8);
            }
            if (!isset($question['points'])) {
                $question['points'] = 1;
            }
        }

        return $data;
    }

    private function generateFallbackQuiz(string $conversationText, int $questionCount, string $difficulty): array
    {
        // Simple fallback quiz generation
        $words = str_word_count($conversationText, 1);
        $topics = array_slice(array_unique($words), 0, 10);
        
        $questions = [];
        for ($i = 0; $i < min($questionCount, 3); $i++) {
            $topic = $topics[$i] ?? 'general topic';
            $questions[] = [
                'id' => 'q' . ($i + 1),
                'type' => 'multiple_choice',
                'question' => "What was discussed about {$topic} in the conversation?",
                'options' => [
                    ['id' => 'a', 'text' => 'Option A', 'is_correct' => true],
                    ['id' => 'b', 'text' => 'Option B', 'is_correct' => false],
                    ['id' => 'c', 'text' => 'Option C', 'is_correct' => false],
                    ['id' => 'd', 'text' => 'Option D', 'is_correct' => false],
                ],
                'explanation' => 'This question is based on the conversation content.',
                'points' => 1,
            ];
        }

        return [
            'title' => 'Quiz from Conversation',
            'description' => 'A quiz generated from your conversation.',
            'difficulty' => $difficulty,
            'questions' => $questions,
        ];
    }

    private function estimateTime(array $questions): int
    {
        $timePerQuestion = [
            'multiple_choice' => 1,
            'true_false' => 0.5,
            'short_answer' => 2,
            'essay' => 5,
            'fill_in_blank' => 1.5,
            'matching' => 2,
            'ordering' => 1.5,
        ];

        $totalTime = 0;
        foreach ($questions as $question) {
            $type = $question['type'];
            $totalTime += $timePerQuestion[$type] ?? 1;
        }

        return max(1, round($totalTime));
    }

    public function exportQuizAsYaml(Quiz $quiz): string
    {
        $data = [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'conversation_id' => $quiz->conversation_id,
                'created_at' => $quiz->created_at->toISOString(),
                'difficulty' => $quiz->difficulty,
                'estimated_time' => $quiz->estimated_time,
                'questions' => $quiz->questions,
            ]
        ];

        return \Symfony\Component\Yaml\Yaml::dump($data, 4, 2);
    }

    public function exportQuizAsJson(Quiz $quiz): string
    {
        $data = [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'conversation_id' => $quiz->conversation_id,
                'created_at' => $quiz->created_at->toISOString(),
                'difficulty' => $quiz->difficulty,
                'estimated_time' => $quiz->estimated_time,
                'questions' => $quiz->questions,
            ]
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}