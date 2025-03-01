import { formatPrompt, callOpenRouter } from './llms.js';

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
    
    // Format the prompt using the message and context
    const formattedPrompt = formatPrompt(message, context);
    
    // Create messages array with a single user message for now
    const messages = [
      {
        role: 'user',
        content: formattedPrompt
      }
    ];
    
    // Call the OpenRouter API with the messages array
    let processedResponse = await callOpenRouter(messages, settings.openrouterKey);
    
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
