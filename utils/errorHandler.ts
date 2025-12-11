
// FIX: AuthError type import removed to avoid module resolution errors. Duck-typing will be used instead.

// Placeholder for remote logging (e.g., Sentry, LogRocket)
const logErrorToService = (_error: unknown, _context?: Record<string, any>) => {
    // In a real app, this would send the error to a service
    // e.g., Sentry.captureException(_error, { extra: _context });
};

/**
 * Translates various error types into human-readable, user-friendly messages.
 */
export const getHumanReadableError = (error: unknown): string => {
    // Log the actual error for debugging purposes
    console.error("An error was handled:", error);
    logErrorToService(error);

    if (error instanceof Error) {
        // FIX: Use duck-typing to check for AuthError shape instead of `instanceof`, which is more robust.
        if ('status' in error) {
            switch (error.message) {
                case 'Invalid login credentials':
                    return ' Incorrect email or password. Please double-check your credentials and try again.';
                case 'User already registered':
                    return 'This email is already registered. Please try logging in instead, or use the "Forgot Password" option if needed.';
                case 'Password should be at least 6 characters':
                    return 'Password too short. Please use at least 6 characters.';
                case 'Email not confirmed':
                    return 'Please verify your email first. Check your inbox for the confirmation link we sent you.';
                case 'Invalid email':
                    return 'Invalid email format. Please enter a valid email address (e.g., you@example.com).';
                default:
                     return '⚠️ Authentication failed. Please check your credentials and try again.';
            }
        }
        
        // Handle generic errors by checking their message content
        const message = error.message.toLowerCase();

        // Validation and required field errors
        if (message.includes('fill out all required') || message.includes('required fields')) {
            return 'Please complete all required fields before continuing.';
        }
        
        if (message.includes('cycle information')) {
            return 'Please enter your last period date and cycle length for personalized tracking.';
        }

        // Network connection issues
        if (message.includes('failed to fetch') || message.includes('network request failed') || message.includes('network error')) {
            return 'No internet connection. Please check your network and try again.';
        }
        
        if (message.includes('cors') || message.includes('cross-origin')) {
            return 'Security error: Cross-origin request blocked. Please try refreshing the page or contact support.';
        }
        
        // Database/Supabase specific errors
        if (message.includes('duplicate') || message.includes('unique constraint')) {
            return 'This record already exists. Please use different information or try updating your existing data.';
        }
        
        if (message.includes('foreign key') || message.includes('constraint')) {
            return 'Data relationship error. Please ensure all related information is valid and try again.';
        }
        
        if (message.includes('row-level security') || message.includes('rls') || message.includes('policy')) {
            return 'Permission denied. Please log out and log back in, then try again.';
        }

        // AI-specific errors from groqService and geminiService
        if (message.includes('groq api authentication') || message.includes('api key') || message.includes('authentication failed')) {
            return 'AI service authentication error. Our team has been notified - please try again in a few minutes.';
        }
        
        if (message.includes('rate limit') && message.includes('try again in')) {
            // Extract time from message if present
            const timeMatch = message.match(/try again in ([\d\w\s]+)/i);
            if (timeMatch) {
                return `Rate limit exceeded. You've sent too many requests. Please wait ${timeMatch[1]} before trying again.`;
            }
            return 'Rate limit exceeded. Please wait a few minutes before trying again.';
        }
        
        if (message.includes('rate limit exceeded') || message.includes('too many requests')) {
            return 'Too many requests. Please wait 30-60 seconds before trying again.';
        }

        if (message.includes('ai response was empty') || message.includes('no response')) {
            return 'AI service returned no response. Please try again - this usually works on the second attempt.';
        }
        
        if (message.includes('unexpected format') || message.includes('parsing json') || message.includes('parse error')) {
            return 'Invalid response format from AI service. Please try again.';
        }
        
        if (message.includes('image') && (message.includes('too large') || message.includes('size'))) {
            return 'Image file is too large. Please use an image under 10MB (try compressing or resizing it).';
        }
        
        if (message.includes('invalid file type') || message.includes('file type') || message.includes('unsupported file')) {
            return 'Unsupported file type. Only JPEG, PNG, and WebP images are accepted.';
        }

        // Generic database errors
        if (message.includes('database') || message.includes('supabase')) {
             return 'Database error: Unable to save your data. Please check your internet connection and try again.';
        }
        
        if (message.includes('connection')) {
            return 'Connection error: Unable to reach the server. Please check your internet and try again.';
        }
        
        // Validation errors
        if (message.includes('validation') || message.includes('invalid')) {
            return 'Validation error: Please check your information and ensure all fields are filled correctly.';
        }
        
        if (message.includes('missing') || message.includes('not found')) {
            return 'Data not found. Please refresh the page and try again.';
        }
        
        // Timeout errors
        if (message.includes('timeout') || message.includes('timed out')) {
            return '⏱️ Request timed out: The operation took too long. Please try again with a stable internet connection.';
        }
        
        // Permission errors
        if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
            return 'Access denied: You don\'t have permission for this action. Try logging out and back in.';
        }
        
        // Session/token errors
        if (message.includes('session') || message.includes('token') || message.includes('expired')) {
            return 'Session expired. Please log out and log back in to continue.';
        }
    }

    // A friendly, generic fallback message with the actual error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage && errorMessage.length < 200) {
        return `⚠️ Error: ${errorMessage}`;
    }
    
    return 'An unexpected error occurred. Please try again. If the problem persists, contact support.';
};
