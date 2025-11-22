# Pixel Perfect 👾

**AI-Powered Pixel Art Converter & Generator**

Pixel Perfect is a modern web application that generates and refines pixel art sprites using AI. It combines the power of Google's Gemini 3 Pro model with specialized image processing algorithms to create authentic, game-ready assets.

## ✨ Features

- **AI Generation**: Generate pixel art from text prompts using the advanced **Gemini 3 Pro** model.
- **Smart Processing**:
  - **Grid Detection**: Automatically detects the pixel grid size.
  - **Background Removal**: Instantly removes white/solid backgrounds.
  - **Smart Cropping**: Trims the image to the content bounding box.
- **Resolution Control**: Choose from **8x8**, **16x16**, **32x32**, or **64x64** presets.
- **Interactive Editor**:
  - Drag-and-drop upload.
  - Visual grid overlay with toggle.
  - Fine-tune grid offset (X/Y) with sliders (mobile-friendly) or inputs (desktop).
  - Real-time preview.
- **Production Ready**: Exports clean, 1:1 resolution PNGs ready for game engines.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jankepinski/pixel-perfect.git
   cd pixel-perfect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎮 Usage

1. **Generate**: Enter a prompt (e.g., "A fire wizard casting a spell"), select a resolution, and click **Generate**.
2. **Refine**:
   - Use the **Grid Size** slider to match the pixel density.
   - Toggle **Always Show Grid** to visualize alignment.
   - Adjust **Grid Offset** if the pixels aren't perfectly aligned.
3. **Download**: Click **Download Pixel Art** to save your sprite.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
