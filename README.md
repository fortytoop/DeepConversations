# DeepConversations

DeepConversations is a flashcard-style web app for couples (and friends), designed to encourage more meaningful conversations. The questions are drawn from curated prompts by the Gottman Institute's [75 Insightful Questions to Deepen Emotional Intimacy](https://www.gottman.com/blog/75-insightful-questions-to-deepen-emotional-intimacy/) and AI-generated follow-up questions.

> This is an independent project and is not affiliated with, endorsed by, or sponsored by The Gottman Institute.

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Python 3.11+
- FastAPI
- Uvicorn
- OpenAI API
- NumPy

## Project Structure

```text
DeepConversations/
├── backend/              # FastAPI application
├── deployment/           # Example deployment configuration
├── public/               # Static assets
├── src/                  # React application source
│   ├── components/
│   ├── data/
│   ├── hooks/
│   └── utils/
├── firebase.json
├── package.json
└── vite.config.js
```

````markdown
## Getting Started

### Prerequisites

Before you begin, make sure you have:

- Node.js
- npm
- Python 3.11 or later
- An OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/DeepConversations.git
cd DeepConversations
````

### 2. Set up the frontend

#### 2.1 Install the frontend dependencies

```bash
npm install
```

#### 2.2 Start the frontend

```bash
npm run dev
```

The frontend will usually be available at:

```text
http://localhost:5173
```

During local development, Vite proxies `/api` requests to the backend at `http://localhost:8080`.

### 3. Set up the backend

Open another terminal, then complete the following steps.

#### 3.1 Move into the backend directory

```bash
cd backend
```

#### 3.2 Create a virtual environment

```bash
python -m venv .venv
```

#### 3.3 Activate the virtual environment

On macOS or Linux:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

#### 3.4 Install the Python dependencies

```bash
pip install -r requirements.txt
```

#### 3.5 Create the local environment file

On macOS or Linux:

```bash
cp .env.example .env
```

On Windows Command Prompt:

```bat
copy .env.example .env
```

#### 3.6 Add your OpenAI API key

Open `backend/.env` and replace the placeholder value:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### 3.7 Start the backend

```bash
uvicorn main:app --reload --port 8080
```

The API will be available at:

```text
http://localhost:8080
```

## Environment Variables

### Backend

| Variable          | Required        | Description                                                                                  |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`  | Yes             | OpenAI API key used to generate follow-up questions                                          |
| `ALLOWED_ORIGINS` | Production only | Comma-separated frontend URLs permitted by CORS. Defaults to `http://localhost:5173` locally |

For local development, add `OPENAI_API_KEY` to `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

For Cloud Run, copy `deployment/cloud-run-env.example.yaml`, replace the placeholder with your own domain, and deploy it as your environment configuration. Other hosting platforms can set the same variable through their environment settings.

### Frontend

No frontend environment variables are required. During local development, Vite proxies `/api` requests to the backend at `http://localhost:8080`.

## Data and Content Attribution

The 75 prompts in `src/data/questions.json` were manually compiled from The Gottman Institute article [“75 Insightful Questions to Deepen Emotional Intimacy”](https://www.gottman.com/blog/75-insightful-questions-to-deepen-emotional-intimacy/). The article and its content belong to The Gottman Institute. 

## Icon Attribution

The favicon uses the **“Psychology”** icon by **Kukuh Wachyu Bias**, downloaded from [The Noun Project](https://thenounproject.com/icon/psychology-4164462/) under the [Creative Commons Attribution 3.0 Unported license](https://creativecommons.org/licenses/by/3.0/).

The SVG was adapted for use as the project's favicon. No endorsement by the creator or The Noun Project is implied.

## Privacy and Responsible Use

- OpenAI requests are sent through the backend; the API key must never be included in frontend code or committed to Git.
- This app is intended as a conversation aid, not as therapy, medical advice, or crisis support.

## License

The original source code in this repository is licensed under the [MIT License](LICENSE).

This license does not apply to third-party content included in or referenced by the project, including:

- Questions compiled from The Gottman Institute
- The “Psychology” icon by Kukuh Wachyu Bias, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- Third-party libraries and dependencies, which remain subject to their respective licenses

See the attribution sections above for further details.
