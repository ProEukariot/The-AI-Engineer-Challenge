# OpenAI Chat Frontend

A modern, Vercel-styled chat interface for the OpenAI API built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern, responsive design with Vercel-styled components
- 🌙 Dark theme support with system preference detection
- 💬 Real-time streaming chat responses
- ⚙️ Configurable settings (API key, model, system message)
- 📱 Mobile-responsive with collapsible settings sidebar
- 🔒 Secure API key input with password field
- ⚡ Fast and lightweight with Next.js 14

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Enter your OpenAI API key in the settings panel
2. Choose your preferred model (GPT-4, GPT-4 Turbo, or GPT-3.5 Turbo)
3. Customize the system message if desired
4. Toggle between light, dark, and system themes using the theme button
5. Start chatting!

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Configuration

The frontend is configured to proxy API requests to `http://localhost:8000` (your FastAPI backend). Make sure your backend is running on port 8000.

## Deployment

This frontend is optimized for deployment on Vercel. Simply connect your repository to Vercel for automatic deployments.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Components**: Custom Vercel-styled UI components