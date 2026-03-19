# VOID - Premium AI Chat Application

A production-ready, ultra-premium AI chatbot interface modeling high-end conversational tools, powered natively by the Groq API via a secure Netlify serverless backend.

## Local Development Setup (CRITICAL FIX)

To run this project locally with the backend attached, you **MUST** use the Netlify CLI. 

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Set your Groq API key in the `.env` file at the root of the project:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
   *Note: This API key is ONLY used by the secure Netlify serverless backend. It is never exposed to the frontend browser.*

3. **Run Locally**
   Start the full-stack local development server:
   ```bash
   npx netlify dev
   ```
   > **DO NOT use `npm run dev`.** 
   > `npm run dev` only starts the Vite frontend. It will not start the Netlify Functions backend, meaning the `/api/chat` route will fail and the chatbot will not connect to Groq. Always use `npx netlify dev` to run both simultaneously.

## Architecture Guidelines
- **No Database:** Chat history is stored entirely in local React state.
- **No Auth:** This is a frictionless, open-access frontend demonstration.
- **Routing:** The React frontend securely POSTs to `/api/chat`. The `netlify.toml` file redirects this universally to the secure Node.js backend (`/.netlify/functions/chat`). 
