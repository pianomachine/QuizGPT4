<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Quiz;
use App\Models\Conversation;
use App\Services\QuizGenerator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class QuizController extends Controller
{
    protected QuizGenerator $quizGenerator;

    public function __construct(QuizGenerator $quizGenerator)
    {
        $this->quizGenerator = $quizGenerator;
    }

    public function generateFromConversation(Request $request, int $conversationId): JsonResponse
    {
        $request->validate([
            'question_count' => 'integer|min:1|max:20',
            'difficulty' => 'in:easy,medium,hard',
            'question_types' => 'array',
            'question_types.*' => 'in:multiple_choice,true_false,short_answer,essay,fill_in_blank,matching,ordering',
            'language' => 'in:Japanese,English',
        ]);

        $conversation = Conversation::where('id', $conversationId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation not found',
            ], 404);
        }

        // Check if conversation has enough content
        if ($conversation->messages()->count() < 2) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation must have at least 2 messages to generate a quiz',
            ], 400);
        }

        try {
            $options = [
                'question_count' => $request->input('question_count', 5),
                'difficulty' => $request->input('difficulty', 'medium'),
                'question_types' => $request->input('question_types', ['multiple_choice', 'true_false', 'short_answer']),
                'language' => $request->input('language', 'Japanese'),
            ];

            $quiz = $this->quizGenerator->generateQuizFromConversation($conversation, $options);

            return response()->json([
                'success' => true,
                'quiz' => $this->formatQuizResponse($quiz),
            ]);
        } catch (\Exception $e) {
            Log::error('Quiz generation failed', ['error' => $e->getMessage(), 'conversation_id' => $conversationId]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate quiz: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $quizzes = Auth::user()->quizzes()
            ->with('conversation')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($quiz) {
                return $this->formatQuizResponse($quiz);
            });

        return response()->json([
            'success' => true,
            'quizzes' => $quizzes,
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $quiz = Quiz::where('id', $id)
            ->where('user_id', Auth::id())
            ->with('conversation')
            ->first();

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'error' => 'Quiz not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'quiz' => $this->formatQuizResponse($quiz),
        ]);
    }

    public function showQuizPage(Request $request, int $id)
    {
        $quiz = Quiz::where('id', $id)
            ->where('user_id', Auth::id())
            ->with('conversation')
            ->first();

        if (!$quiz) {
            return redirect()->route('dashboard')->with('error', 'Quiz not found');
        }

        return Inertia::render('quiz/show', [
            'quiz' => $this->formatQuizResponse($quiz),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $quiz = Quiz::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'error' => 'Quiz not found',
            ], 404);
        }

        $quiz->delete();

        return response()->json([
            'success' => true,
            'message' => 'Quiz deleted successfully',
        ]);
    }

    public function exportYaml(Request $request, int $id)
    {
        $quiz = Quiz::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'error' => 'Quiz not found',
            ], 404);
        }

        $yaml = $this->quizGenerator->exportQuizAsYaml($quiz);

        return response($yaml, 200, [
            'Content-Type' => 'application/x-yaml',
            'Content-Disposition' => 'attachment; filename="quiz-' . $quiz->id . '.yaml"',
        ]);
    }

    public function exportJson(Request $request, int $id)
    {
        $quiz = Quiz::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$quiz) {
            return response()->json([
                'success' => false,
                'error' => 'Quiz not found',
            ], 404);
        }

        $json = $this->quizGenerator->exportQuizAsJson($quiz);

        return response($json, 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="quiz-' . $quiz->id . '.json"',
        ]);
    }

    public function getQuestionTypes(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'question_types' => [
                [
                    'value' => 'multiple_choice',
                    'label' => 'Multiple Choice',
                    'description' => 'Questions with multiple options, one correct answer'
                ],
                [
                    'value' => 'true_false',
                    'label' => 'True/False',
                    'description' => 'Questions with true or false answers'
                ],
                [
                    'value' => 'short_answer',
                    'label' => 'Short Answer',
                    'description' => 'Questions requiring brief written responses'
                ],
                [
                    'value' => 'essay',
                    'label' => 'Essay',
                    'description' => 'Questions requiring longer written responses'
                ],
                [
                    'value' => 'fill_in_blank',
                    'label' => 'Fill in the Blank',
                    'description' => 'Questions with missing words to be filled in'
                ],
                [
                    'value' => 'matching',
                    'label' => 'Matching',
                    'description' => 'Questions requiring matching items between two lists'
                ],
                [
                    'value' => 'ordering',
                    'label' => 'Ordering',
                    'description' => 'Questions requiring items to be put in correct order'
                ],
            ],
        ]);
    }

    private function formatQuizResponse(Quiz $quiz): array
    {
        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'difficulty' => $quiz->difficulty,
            'estimated_time' => $quiz->estimated_time,
            'questions_count' => $quiz->getQuestionsCount(),
            'total_points' => $quiz->getTotalPoints(),
            'questions' => $quiz->questions,
            'conversation' => [
                'id' => $quiz->conversation->id,
                'title' => $quiz->conversation->title,
            ],
            'created_at' => $quiz->created_at->toISOString(),
            'updated_at' => $quiz->updated_at->toISOString(),
        ];
    }
}