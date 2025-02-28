# Chat with Webpage

A Chrome extension that enables contextual conversations with web pages using LLMs via OpenRouter.

## Recent Updates

- ✅ Fixed popup window display when using context menu
- ✅ Improved context extraction and display
- ✅ Enhanced highlighting of selected text
- ✅ Better error handling
- ✅ Optimized message flow between components

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

## Development

The extension is built with a modular architecture:

- `popup/`: Extension UI and settings
- `background/`: Service worker and API communication
- `content-scripts/`: DOM parsing and context extraction
- `modules/`: Optional feature implementations

To develop:
```bash
npm run watch
```

## Architecture

- Uses Manifest V3 for Chrome extensions
- Modular design for easy feature additions
- Context-aware DOM parsing with hierarchical extraction
- Storage-based message passing for reliable context transfer
- Secure API key management
- Threaded conversation storage
- Rich context display with highlighted selection

## Future Enhancements

- [ ] Readability.js integration for better content extraction
- [ ] Enhanced conversation threading
- [ ] Multiple model comparison
- [ ] Citation verification
- [ ] Export formats (MD, HTML, JSON)
- [ ] Custom prompt templates

## License

MIT
