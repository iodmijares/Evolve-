// Shared theme for the entire app

export const colors = {
    primary: '#10b981', // Emerald 500
    'primary-focus': '#059669', // Emerald 600
    secondary: '#0ea5e9', // Sky 500
    accent: '#f59e0b', // Amber 500
    amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        300: '#fcd34d',
        500: '#f59e0b',
        800: '#92400e',
    },
    light: '#ffffff',
    dark: '#111827', // Use neutral Gray-900 for a softer dark background
    base: '#f8fafc', // Slate 50
    muted: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      400: '#f87171',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    sky: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      800: '#075985',
    },
    fuchsia: {
        50: '#fdf4ff',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        800: '#86198f',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
    },
    gray: {
      100: '#f3f4f6',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
};

export const typography = {
    h1: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    h2: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    h3: {
        fontSize: 18,
        fontWeight: '600',
    },
    body: {
        fontSize: 16,
    },
    subtle: {
        fontSize: 14,
        color: colors.muted,
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const breakpoints = {
    sm: 400,
    md: 768,
    lg: 1024,
};