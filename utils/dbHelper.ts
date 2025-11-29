// Helper to map DB snake_case to JS camelCase
export const fromDBShape = <T extends Record<string, any>>(data: any): T => {
    if (!data) return data;
    const camelCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            camelCaseData[camelKey] = data[key];
        }
    }
    return camelCaseData as T;
};

// Helper to map JS camelCase to DB snake_case
export const toDBShape = (data: Record<string, any>): Record<string, any> => {
    if (!data) return data;
    const snakeCaseData: Record<string, any> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeCaseData[snakeKey] = data[key];
        }
    }
    return snakeCaseData;
};
