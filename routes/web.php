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
    
    // Chat API routes
    Route::post('/api/chat/send', 'App\Http\Controllers\ChatController@sendMessage');
    Route::get('/api/chat/conversations', 'App\Http\Controllers\ChatController@getConversations');
    Route::post('/api/chat/conversations', 'App\Http\Controllers\ChatController@createConversation');
    Route::delete('/api/chat/conversations/{id}', 'App\Http\Controllers\ChatController@deleteConversation')->where('id', '[0-9]+');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
