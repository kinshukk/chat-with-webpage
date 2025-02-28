// Content script for handling page interactions

// Listen for context menu selection events from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SELECTION_CONTEXT') {
    console.log('Content script received SELECTION_CONTEXT with text:', message.text);
    
    const context = window.domParser.getSelectionContext(message.text);
    
    // Add page URL and title to context
    context.url = window.location.href;
    context.pageTitle = document.title;

    // Get article content if available
    const articleContent = window.domParser.extractArticle();
    if (articleContent) {
      context.articleContent = articleContent;
    }
    
    // Format the context for display and storage
    context.formattedContext = formatContextForPrompt(context);
    
    console.log('Generated page context:', context);
    
    // Ensure the storage operation completes before responding
    chrome.storage.local.set({ 
      pageContext: context 
    }, () => {
      // Check if there was an error with storage
      if (chrome.runtime.lastError) {
        console.error('Error storing context:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      
      console.log('Context saved to storage successfully');
      
      // Also send context to runtime for listeners
      chrome.runtime.sendMessage({
        type: 'SELECTION_CONTEXT',
        text: message.text,
        ...context
      }, (messageResponse) => {
        console.log('Runtime message response:', messageResponse);
        
        // Finally respond to the original message
        sendResponse({ success: true, contextSaved: true });
      });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

/**
 * Format the context information into a prompt-friendly string
 */
function formatContextForPrompt(context) {
  if (!context) return '';

  const parts = [];

  // Add page information
  if (context.pageTitle) {
    parts.push(`Page: ${context.pageTitle}`);
  }

  if (context.url) {
    parts.push(`URL: ${context.url}`);
  }

  // Add headings for hierarchical context
  if (context.headings && context.headings.length > 0) {
    parts.push('Section hierarchy:', context.headings.join(' > '));
  }

  // Add the selected text
  parts.push('Selected text:', `"${context.selectedText}"`);

  // Add surrounding paragraph for more context
  if (context.surroundingParagraph && 
      context.surroundingParagraph !== context.selectedText) {
    parts.push('\nFull paragraph:', `"${context.surroundingParagraph}"`);
  }

  // Add article content if available and different from selection
  if (context.articleContent && 
      context.articleContent.content !== context.surroundingParagraph) {
    parts.push('\nRelevant article content:', context.articleContent.content);
  }

  return parts.join('\n');
}

// Initialize page analysis when loaded
document.addEventListener('DOMContentLoaded', () => {
  // Extract article content for potential future use
  window.domParser.extractArticle();
});
