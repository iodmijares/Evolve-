/// <reference types="vite/client" />

// Image module declarations
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  // Groq API (AI text and vision)
  readonly VITE_GROQ_API_KEY?: string;
  readonly GROQ_API_KEY?: string;
  
  // Gemini API (deprecated - kept for backward compatibility)
  readonly VITE_GEMINI_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  
  // Supabase Configuration
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
