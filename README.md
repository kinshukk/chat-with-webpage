# Chat with Webpage

Chat with any section of any webpage (images, text). Like taking persistent notes on webpages

## Features

- 🔍 Context-aware conversations with webpage content
- 🌳 Tree-style conversation interface
- ⚙️ Multiple LLM model support via OpenRouter
- 📑 Smart content selection and context extraction
- 🔧 Modular architecture with optional features:
  - Auto-summarization
  - Model comparison
  - Citation tracking
  - Export capabilities

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/)
2. Click the extension icon and enter your API key in settings
3. Select any text on a webpage
4. Right-click and choose "Ask about selection"
5. A popup window will open with your selection highlighted and page context displayed
6. Type your question about the selection
7. Get context-aware responses from the AI

> **Note**: The extension automatically extracts not just the selected text but also surrounding context and page content to provide more accurate responses.

## Future Enhancements

- [ ] Readability.js integration for better content extraction
- [ ] Enhanced conversation threading
- [ ] Multiple model comparison
- [ ] Citation verification
- [ ] Export formats (MD, HTML, JSON)
- [ ] Custom prompt templates