<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Chat conversation page
    Route::get('chat/{conversation_id}', 'App\Http\Controllers\ChatController@showConversation')
        ->where('conversation_id', '[0-9]+')
        ->name('chat.show');
    
    // Quiz pages
    Route::get('quizzes', function () {
        return Inertia::render('quiz/index');
    })->name('quizzes.index');
    
    Route::get('quiz/{id}', 'App\Http\Controllers\QuizController@showQuizPage')
        ->where('id', '[0-9]+')
        ->name('quiz.show');
    
    // Chat API routes
    Route::post('/api/chat/send', 'App\Http\Controllers\ChatController@sendMessage');
    Route::get('/api/chat/conversations', 'App\Http\Controllers\ChatController@getConversations');
    Route::get('/api/chat/conversations/{id}', 'App\Http\Controllers\ChatController@getConversation')->where('id', '[0-9]+');
    Route::post('/api/chat/conversations', 'App\Http\Controllers\ChatController@createConversation');
    Route::put('/api/chat/conversations/{id}/title', 'App\Http\Controllers\ChatController@updateConversationTitle')->where('id', '[0-9]+');
    Route::delete('/api/chat/conversations/{id}', 'App\Http\Controllers\ChatController@deleteConversation')->where('id', '[0-9]+');
    
    // Quiz API routes
    Route::get('/api/quizzes', 'App\Http\Controllers\QuizController@index');
    Route::get('/api/quizzes/{id}', 'App\Http\Controllers\QuizController@show')->where('id', '[0-9]+');
    Route::post('/api/conversations/{conversation_id}/generate-quiz', 'App\Http\Controllers\QuizController@generateFromConversation')->where('conversation_id', '[0-9]+');
    Route::delete('/api/quizzes/{id}', 'App\Http\Controllers\QuizController@destroy')->where('id', '[0-9]+');
    Route::get('/api/quizzes/{id}/export/yaml', 'App\Http\Controllers\QuizController@exportYaml')->where('id', '[0-9]+');
    Route::get('/api/quizzes/{id}/export/json', 'App\Http\Controllers\QuizController@exportJson')->where('id', '[0-9]+');
    Route::get('/api/quiz/question-types', 'App\Http\Controllers\QuizController@getQuestionTypes');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
