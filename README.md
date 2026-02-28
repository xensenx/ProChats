# ProChat

**ProChat** is an interactive web platform designed to provide engaging and natural conversations with AI-powered anime characters. Users can chat with pre-configured characters that possess unique personalities and conversational styles, powered by state-of-the-art language models from Google and NVIDIA.

## Features

- **AI Character Conversations:** Chat with pre-configured characters including Frieren, Nao Tomori, and Thorfinn, each carefully prompt-engineered to emulate their respective personalities.
- **Multiple Access Modes:**
  - **User API Key Mode:** Bring your own Google API Key to use the Gemma 3 27B IT model directly from the browser.
  - **Admin Mode:** Log in using a pre-configured admin password to access powerful AI models hosted via the server.
- **Multiple AI Models (Admin Mode):**
  - Fast (meta/llama-3.1-8b-instruct)
  - Balanced (meta/llama-3.1-70b-instruct)
  - Smart (mistralai/mixtral-8x22b-instruct)
  - Pro (meta/llama-3.1-405b-instruct)
  - Experimental (deepseek-ai/deepseek-v3.2)
  - Gemma (gemma-3-27b-it via Google API)
- **Local Storage:** All conversations are stored privately in your browser using `localStorage`. No chat history is saved on the server.
- **Export Chats:** Export all your active conversations to JSON files.

## Characters

- **Frieren (Frieren: Beyond Journey's End):** An ancient elf mage learning to appreciate human connection. She is calm, soft-spoken, and warm.
- **Nao Tomori (Charlotte):** A sharp-tongued student council president with a caring heart. Direct, sassy, and playful.
- **Thorfinn (Vinland Saga):** A reformed pacifist warrior seeking peace. Calm, sincere, and encouraging.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript.
- **Backend / API:** Node.js serverless functions (designed for platforms like Vercel).
- **APIs:**
  - NVIDIA API (`integrate.api.nvidia.com`)
  - Google Gemini API (`generativelanguage.googleapis.com`)

## Setup & Deployment

ProChat requires a few environment variables to be set for the backend functions to work correctly (especially for Admin Mode).

### Environment Variables

You need to configure the following environment variables on your hosting provider (e.g., Vercel) or locally in your `.env` file for backend execution:

- `ADMIN_PASSWORD`: The password required to unlock "Admin Mode" on the frontend.
- `NVIDIA_API_KEY`: Your API key from NVIDIA to use the Llama, Mistral, and DeepSeek models.
- `GEMMA_API_KEY`: Your Google API key to power the Gemma model when accessed via the backend in Admin Mode.

*(Note: Users providing their own Google API key in "User API Key Mode" do not use the backend for chat generation; their requests go directly to the Google API from the browser.)*

## Usage

1. Open `index.html` in your browser or deploy the app to a static site host with serverless function support (like Vercel).
2. Choose your access method on the landing page:
   - Enter your personal Google API Key.
   - Enter the Admin Password.
3. If using Admin Mode, select your preferred AI model.
4. Select a character to chat with and start the conversation!

## License

This project is NOT open-source. Please check the included `LICENSE` file for more details.
