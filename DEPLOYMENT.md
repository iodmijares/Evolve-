# 🚀 Security & Deployment Guide

This project has been updated to secure sensitive data and API keys. Follow these steps to deploy the changes.

## 1. Database Security (Row Level Security)

We have created a SQL migration file to secure your database tables.

**Option A: Via Supabase Dashboard (Easiest)**
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Open the file `supabase/migrations/RLS_policies.sql` in this project.
4. Copy the entire content.
5. Paste it into the SQL Editor in your dashboard and click **Run**.

**Option B: Via CLI**
If you have the Supabase CLI installed and linked:
```bash
npx supabase db push
```

---

## 2. Deploying the Secure AI Service

The AI logic (Groq) has been moved to a **Supabase Edge Function** to hide your API Key. You must deploy this function for the AI features to work.

### Prerequisites
- You need the **Supabase CLI** installed.
- You need your **Supabase Project ID** (found in Project Settings).
- You need your **Groq API Key**.

### Steps

1. **Login to Supabase CLI** (if not already logged in):
   ```bash
   npx supabase login
   ```

2. **Link your project**:
   Replace `<project-id>` with your actual project ID (e.g., `abcdefghijklm`).
   ```bash
   npx supabase link --project-ref <project-id>
   ```

3. **Set your Groq API Key as a secret**:
   This securely stores the key on the server.
   ```bash
   npx supabase secrets set GROQ_API_KEY=your_actual_groq_api_key_here
   ```

4. **Deploy the Function**:
   ```bash
   npx supabase functions deploy ai-service --no-verify-jwt
   ```
   *(Note: We use `--no-verify-jwt` if you want to allow public calls, but since our client uses `supabase.functions.invoke`, it handles auth automatically. If you encounter 401 errors, check your function's JWT verification settings).*

---

## 3. Verification

After deployment:
1. Reload your application.
2. Try generating a meal plan or checking the "Community Hub".
3. Check the **Edge Function Logs** in the Supabase Dashboard if anything fails.
