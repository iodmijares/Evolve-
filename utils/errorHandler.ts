
// FIX: AuthError type import removed to avoid module resolution errors. Duck-typing will be used instead.

/**
 * Translates various error types into human-readable, user-friendly messages.
 */
export const getHumanReadableError = (error: unknown): string => {
    // Log the actual error for debugging purposes
    console.error("An error was handled:", error);

    if (error instanceof Error) {
        // FIX: Use duck-typing to check for AuthError shape instead of `instanceof`, which is more robust.
        if ('status' in error) {
            switch (error.message) {
                case 'Invalid login credentials':
                    return 'The email or password you entered is incorrect. Please try again.';
                case 'User already registered':
                    return 'It looks like you already have an account with this email. Why not try logging in?';
                case 'Password should be at least 6 characters':
                    return 'For your security, please choose a password that is at least 6 characters long.';
                default:
                     return 'There was an issue with authentication. Please try again.';
            }
        }
        
        // Handle generic errors by checking their message content
        const message = error.message.toLowerCase();

        // Network connection issues
        if (message.includes('failed to fetch') || message.includes('network request failed') || message.includes('network error')) {
            return '📡 Looks like you\'re offline. Please check your internet connection and try again.';
        }
        
        if (message.includes('cors') || message.includes('cross-origin')) {
            return '🔒 Security settings prevented this request. This is a technical issue - please contact support.';
        }

        // AI-specific errors from groqService and geminiService
        if (message.includes('groq api authentication') || message.includes('api key') || message.includes('authentication failed')) {
            return '🔑 We\'re having trouble connecting to our AI service. This is on us - please contact support.';
        }
        
        if (message.includes('rate limit') && message.includes('try again in')) {
            // Extract time from message if present
            const timeMatch = message.match(/try again in ([\d\w\s]+)/i);
            if (timeMatch) {
                return `⏰ Whoa, slow down! You've used up your AI requests for now. Try again in ${timeMatch[1]}.`;
            }
            return '⏰ You\'ve reached your AI request limit. Please wait a few minutes before trying again.';
        }
        
        if (message.includes('rate limit exceeded')) {
            return '⏰ Our AI is getting a lot of love right now. Please wait 30 seconds and try again.';
        }

        if (message.includes('ai response was empty')) {
            return '🤔 The AI didn\'t respond. This happens sometimes - please try again!';
        }
        
        if (message.includes('unexpected format') || message.includes('parsing json')) {
            return '🔄 The AI gave us a confusing response. Let\'s try that again - it should work this time!';
        }
        
        if (message.includes('image') && (message.includes('too large') || message.includes('size'))) {
            return '📸 That image is too large. Please try a smaller photo (under 10MB).';
        }
        
        if (message.includes('invalid file type') || message.includes('file type')) {
            return '📁 We can only scan JPEG, PNG, or WebP images. Please try a different file.';
        }

        // Generic database errors
        if (message.includes('database') || message.includes('supabase')) {
             return '💾 We couldn\'t save your data right now. Please check your connection and try again.';
        }
        
        // Validation errors
        if (message.includes('validation') || message.includes('invalid')) {
            return '✏️ Some information doesn\'t look quite right. Please check your entries and try again.';
        }
        
        // Timeout errors
        if (message.includes('timeout') || message.includes('timed out')) {
            return '⏱️ That took too long - we gave up waiting. Please try again with a faster connection.';
        }
        
        // Permission errors
        if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
            return '🚫 You don\'t have permission to do that. Try logging out and back in.';
        }
    }

    // A friendly, generic fallback message
    return '😅 Oops! Something unexpected happened. Don\'t worry - just try again and it should work!';
};
