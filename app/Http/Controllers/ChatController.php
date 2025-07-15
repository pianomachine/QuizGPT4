<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'required|integer|exists:conversations,id',
        ]);

        $message = $request->input('message');
        $conversationId = $request->input('conversation_id');

        $conversation = Conversation::findOrFail($conversationId);
        
        // Check if user owns this conversation
        if ($conversation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        try {
            // Save user message to database
            $userMessage = Message::create([
                'conversation_id' => $conversationId,
                'content' => $message,
                'role' => 'user',
            ]);

            // Get conversation history from database
            $conversationHistory = $conversation->messages()
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($msg) {
                    return [
                        'role' => $msg->role,
                        'content' => $msg->content,
                    ];
                })->toArray();

            $response = $this->generateOpenAIResponse($message, $conversationHistory);

            // Save assistant response to database
            $assistantMessage = Message::create([
                'conversation_id' => $conversationId,
                'content' => $response,
                'role' => 'assistant',
            ]);

            return response()->json([
                'success' => true,
                'message' => [
                    'id' => $assistantMessage->id,
                    'content' => $response,
                    'role' => 'assistant',
                    'timestamp' => $assistantMessage->created_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Chat error: ' . $e->getMessage());
            
            // Try fallback response if OpenAI fails
            $fallbackResponse = $this->generateFallbackResponse($message);
            
            // Save fallback response to database
            $assistantMessage = Message::create([
                'conversation_id' => $conversationId,
                'content' => $fallbackResponse,
                'role' => 'assistant',
            ]);
            
            return response()->json([
                'success' => true,
                'message' => [
                    'id' => $assistantMessage->id,
                    'content' => $fallbackResponse,
                    'role' => 'assistant',
                    'timestamp' => $assistantMessage->created_at->toISOString(),
                ],
                'fallback' => true,
                'error_message' => $e->getMessage(),
            ]);
        }
    }

    private function generateOpenAIResponse(string $message, array $conversationHistory = []): string
    {
        $apiKey = env('OPENAI_API_KEY');
        
        if (!$apiKey) {
            throw new \Exception('OpenAI API key is not configured');
        }

        // Build messages array with conversation history
        $messages = [
            [
                'role' => 'system',
                'content' => 'You are a helpful assistant. Please provide helpful, accurate, and conversational responses.'
            ]
        ];

        // Add conversation history (limit to last 10 messages to avoid token limits)
        $recentHistory = array_slice($conversationHistory, -10);
        foreach ($recentHistory as $historyMessage) {
            $messages[] = [
                'role' => $historyMessage['role'],
                'content' => $historyMessage['content']
            ];
        }

        // Add the current message
        $messages[] = [
            'role' => 'user',
            'content' => $message
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => $messages,
            'max_tokens' => 1000,
            'temperature' => 0.7,
        ]);

        if (!$response->successful()) {
            $errorBody = $response->json();
            Log::error('OpenAI API error: ' . $response->body());
            
            // Handle specific OpenAI API errors
            if (isset($errorBody['error']['code'])) {
                switch ($errorBody['error']['code']) {
                    case 'insufficient_quota':
                        throw new \Exception('OpenAI API quota exceeded. Please check your OpenAI billing settings.');
                    case 'invalid_api_key':
                        throw new \Exception('Invalid OpenAI API key. Please check your configuration.');
                    case 'rate_limit_exceeded':
                        throw new \Exception('OpenAI API rate limit exceeded. Please try again later.');
                    case 'internal_error':
                        throw new \Exception('OpenAI service is temporarily unavailable. Please try again in a few moments.');
                    case 'service_unavailable':
                        throw new \Exception('OpenAI service is currently unavailable. Please try again later.');
                    default:
                        throw new \Exception('OpenAI API error: ' . ($errorBody['error']['message'] ?? 'Unknown error'));
                }
            }
            
            throw new \Exception('Failed to get response from OpenAI');
        }

        $data = $response->json();
        
        if (!isset($data['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid response format from OpenAI');
        }

        return $data['choices'][0]['message']['content'];
    }

    private function generateFallbackResponse(string $message): string
    {
        $lowerMessage = strtolower($message);
        
        // Basic keyword-based responses
        if (strpos($lowerMessage, 'hello') !== false || strpos($lowerMessage, 'hi') !== false) {
            return '👋 Hello! I\'m currently running in limited mode due to OpenAI API issues. I can provide basic responses, but for full AI capabilities, please try again later when the service is restored.';
        }
        
        if (strpos($lowerMessage, 'how are you') !== false) {
            return '🤖 I\'m experiencing some technical difficulties with the AI service right now, but I\'m here to help as best I can with basic responses. Please try again later for enhanced AI functionality.';
        }
        
        if (strpos($lowerMessage, 'help') !== false) {
            return '🆘 I\'m currently running in limited mode due to OpenAI API issues. I can provide basic keyword-based responses, but for full AI capabilities and detailed help, please try again later.';
        }
        
        if (strpos($lowerMessage, 'what') !== false || strpos($lowerMessage, 'how') !== false || strpos($lowerMessage, 'why') !== false) {
            return '❓ I\'d love to help you with that question, but I\'m currently experiencing technical difficulties with the AI service. Please try again later for a more detailed and intelligent response.';
        }
        
        if (strpos($lowerMessage, 'thank') !== false) {
            return '🙏 You\'re welcome! I\'m sorry I can only provide basic responses right now due to AI service issues. Please try again later for full functionality.';
        }
        
        if (strpos($lowerMessage, 'bye') !== false || strpos($lowerMessage, 'goodbye') !== false) {
            return '👋 Goodbye! I hope the AI service will be fully restored when you return. Thank you for your patience!';
        }
        
        // Default fallback
        return '🚧 I apologize, but I\'m currently experiencing technical difficulties with the OpenAI API and cannot provide my usual intelligent responses. This is a basic fallback message. Please try again later when the AI service is restored. Thank you for your patience!';
    }

    public function getConversations(Request $request): JsonResponse
    {
        $conversations = Auth::user()->conversations()
            ->orderBy('updated_at', 'desc')
            ->with('messages')
            ->get()
            ->map(function ($conversation) {
                return [
                    'id' => $conversation->id,
                    'title' => $conversation->title,
                    'created_at' => $conversation->created_at->toISOString(),
                    'updated_at' => $conversation->updated_at->toISOString(),
                    'messages' => $conversation->messages->map(function ($message) {
                        return [
                            'id' => $message->id,
                            'content' => $message->content,
                            'role' => $message->role,
                            'timestamp' => $message->created_at->toISOString(),
                        ];
                    }),
                ];
            });

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function createConversation(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:100',
        ]);

        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'title' => $request->input('title'),
        ]);

        return response()->json([
            'success' => true,
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'created_at' => $conversation->created_at->toISOString(),
                'updated_at' => $conversation->updated_at->toISOString(),
                'messages' => [],
            ],
        ]);
    }

    public function deleteConversation(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        
        // Check if user owns this conversation
        if ($conversation->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
        ]);
    }
}