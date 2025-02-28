// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Prompt template for contextual queries
const PROMPT_TEMPLATE = `You are a helpful AI assistant analyzing web content. 

Context from the webpage:
{context}

User's selection: "{selection}"

User's question: {question}

Please provide a detailed response based on the given context and selection. If the context is insufficient to answer accurately, please indicate that.`;

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEND_MESSAGE') {
    handleMessage(request.payload, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ask-llm',
    title: 'Ask about selection',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ask-llm') {
    console.log('Context menu clicked with selection:', info.selectionText);
    
    // Store the selection temporarily
    chrome.storage.local.set({ 
      currentSelection: {
        text: info.selectionText,
        tabId: tab.id
      }
    });
    
    // Send message to content script to gather context
    chrome.tabs.sendMessage(tab.id, {
      type: 'SELECTION_CONTEXT',
      text: info.selectionText
    }, (response) => {
      console.log('Received response from content script:', response);
      
      // Only open popup after content script has processed the context
      if (response && response.success) {
        // Wait a moment to ensure storage is updated
        setTimeout(() => {
          // Open the extension popup
          chrome.windows.create({
            url: chrome.runtime.getURL('popup/popup.html'),
            type: 'popup',
            width: 450,
            height: 600
          });
        }, 100);
      } else {
        console.error('Failed to get context from content script');
        // Open popup anyway, but it might not have context
        chrome.windows.create({
          url: chrome.runtime.getURL('popup/popup.html'),
          type: 'popup',
          width: 450,
          height: 600
        });
      }
    });
  }
});

// Message handler
async function handleMessage({ message, settings, context }, sendResponse) {
  try {
    if (!settings.openrouterKey) {
      throw new Error('OpenRouter API key not set');
    }

    // Get full context or use what's available
    let contextText = 'No additional context available';
    let selectionText = 'No text selected';
    
    if (context) {
      // If context has a formattedContext property, use that
      if (context.formattedContext) {
        contextText = context.formattedContext;
      } 
      // Otherwise fall back to surroundingParagraph
      else if (context.surroundingParagraph) {
        contextText = context.surroundingParagraph;
      }
      
      // Get selected text
      selectionText = context.selectedText || '';
      
      // If there's article content and it's not already in the context
      if (context.articleContent && context.articleContent.content) {
        // Add article content if it's not already part of the context
        if (!contextText.includes(context.articleContent.content)) {
          contextText += `\n\nFull article content: ${context.articleContent.content}`;
        }
      }
    }
    
    // Format prompt using template
    const formattedPrompt = PROMPT_TEMPLATE
      .replace('{context}', contextText)
      .replace('{selection}', selectionText)
      .replace('{question}', message);

    console.log('Sending prompt to OpenRouter:', formattedPrompt);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openrouterKey}`,
        'HTTP-Referer': chrome.runtime.getManifest().homepage_url || 'https://github.com/your-repo',
        'X-Title': chrome.runtime.getManifest().name
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',  // Default model, can be made configurable
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant analyzing web content.'
          },
          {
            role: 'user',
            content: formattedPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }
    
    // Process response based on enabled features
    let processedResponse = data.choices[0].message.content;
    
    // Only process if features are enabled AND implemented
    if (settings.features.summarization) {
      // Feature stub - not implemented yet
      // processedResponse = await processSummarization(processedResponse);
    }
    
    if (settings.features.citations) {
      // Feature stub - not implemented yet
      // processedResponse = await processCitations(processedResponse);
    }

    sendResponse({ text: processedResponse });
  } catch (error) {
    console.error('Error in handleMessage:', error);
    sendResponse({ error: error.message || 'Unknown error occurred' });
  }
}
