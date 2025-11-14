/**
 * Environment configuration validator for production readiness
 */

interface EnvironmentConfig {
  groqApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

class EnvironmentValidator {
  private config: EnvironmentConfig;
  private errors: string[] = [];

  constructor() {
    this.config = {
      groqApiKey: import.meta.env.VITE_GROQ_API_KEY || '',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
    };

    this.validate();
  }

  private validate(): void {
    // Required environment variables
    const required = {
      VITE_GROQ_API_KEY: this.config.groqApiKey,
      VITE_SUPABASE_URL: this.config.supabaseUrl,
      VITE_SUPABASE_ANON_KEY: this.config.supabaseAnonKey,
    };

    for (const [key, value] of Object.entries(required)) {
      if (!value) {
        this.errors.push(`❌ Missing required environment variable: ${key}`);
      }
    }

    // Validate URL formats
    if (this.config.supabaseUrl && !this.isValidUrl(this.config.supabaseUrl)) {
      this.errors.push(`❌ Invalid Supabase URL format: ${this.config.supabaseUrl}`);
    }

    // Validate API key formats
    if (this.config.groqApiKey && !this.config.groqApiKey.startsWith('gsk_')) {
      this.errors.push(`⚠️ Groq API key should start with 'gsk_'`);
    }

    // Production-specific validations
    if (this.config.isProduction) {
      if (this.config.supabaseUrl.includes('localhost')) {
        this.errors.push(`❌ Production build using localhost Supabase URL`);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public isValid(): boolean {
    return this.errors.length === 0;
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public logStatus(): void {
    if (this.isValid()) {
      console.log('✅ Environment configuration valid');
      if (this.config.isDevelopment) {
        console.log('📝 Running in DEVELOPMENT mode');
      } else {
        console.log('🚀 Running in PRODUCTION mode');
      }
    } else {
      console.error('❌ Environment configuration errors:');
      this.errors.forEach((error) => console.error(error));
      
      if (this.config.isProduction) {
        throw new Error('Production build failed: Invalid environment configuration');
      }
    }
  }
}

export const envValidator = new EnvironmentValidator();

// Log status on import
envValidator.logStatus();

// Export config for use throughout app
export const env = envValidator.getConfig();
