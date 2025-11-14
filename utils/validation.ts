/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection, and invalid data
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate number within range
 */
export const isValidNumber = (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
};

/**
 * Sanitize string input (remove special characters, trim)
 */
export const sanitizeString = (input: string, maxLength: number = 255): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, maxLength);
};

/**
 * Validate and sanitize user profile data
 */
export const validateUserProfile = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required');
    } else if (data.name.length < 2 || data.name.length > 50) {
        errors.push('Name must be between 2 and 50 characters');
    }

    if (data.age !== undefined) {
        if (!isValidNumber(data.age, 13, 120)) {
            errors.push('Age must be between 13 and 120');
        }
    }

    if (data.weight !== undefined) {
        if (!isValidNumber(data.weight, 20, 500)) {
            errors.push('Weight must be between 20 and 500 kg');
        }
    }

    if (data.height !== undefined) {
        if (!isValidNumber(data.height, 50, 300)) {
            errors.push('Height must be between 50 and 300 cm');
        }
    }

    if (data.goal && !['weight_loss', 'muscle_gain', 'maintenance'].includes(data.goal)) {
        errors.push('Invalid goal');
    }

    if (data.gender && !['male', 'female'].includes(data.gender)) {
        errors.push('Invalid gender');
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Validate meal data
 */
export const validateMealData = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Meal name is required');
    } else if (data.name.length > 100) {
        errors.push('Meal name too long');
    }

    if (!data.macros || typeof data.macros !== 'object') {
        errors.push('Macros are required');
    } else {
        if (!isValidNumber(data.macros.calories, 0, 10000)) {
            errors.push('Invalid calories (0-10000)');
        }
        if (!isValidNumber(data.macros.protein, 0, 1000)) {
            errors.push('Invalid protein (0-1000g)');
        }
        if (!isValidNumber(data.macros.carbs, 0, 1000)) {
            errors.push('Invalid carbs (0-1000g)');
        }
        if (!isValidNumber(data.macros.fat, 0, 1000)) {
            errors.push('Invalid fat (0-1000g)');
        }
    }

    if (data.mealType && !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(data.mealType)) {
        errors.push('Invalid meal type');
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Validate workout data
 */
export const validateWorkoutData = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Workout name is required');
    } else if (data.name.length > 100) {
        errors.push('Workout name too long');
    }

    if (!data.type || typeof data.type !== 'string') {
        errors.push('Workout type is required');
    }

    if (!isValidNumber(data.duration, 1, 480)) {
        errors.push('Duration must be between 1 and 480 minutes');
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Validate date string
 */
export const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Sanitize journal entry
 */
export const sanitizeJournalEntry = (entry: string): string => {
    return entry
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .substring(0, 5000); // Limit length
};

/**
 * Validate file upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File too large. Maximum size is 10MB' };
    }

    return { valid: true };
};

/**
 * Prevent SQL injection in search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
    return query
        .trim()
        .replace(/['";\\]/g, '') // Remove SQL special characters
        .substring(0, 100); // Limit length
};
