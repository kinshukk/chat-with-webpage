// OpenRouter API configuration
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Prompt template for contextual queries
export const PROMPT_TEMPLATE = `You are a helpful AI assistant analyzing web content. 

Context from the webpage:
{context}

User's selection: "{selection}"

User's question: {question}

Please provide a detailed response based on the given context and selection. If the context is insufficient to answer accurately, please indicate that.`;

/**
 * Formats a prompt using the template and context information
 */
export function formatPrompt(message, context) {
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
  return PROMPT_TEMPLATE
    .replace('{context}', contextText)
    .replace('{selection}', selectionText)
    .replace('{question}', message);
}

/**
 * Sends messages to the OpenRouter API and returns the response
 */
export async function callOpenRouter(messages, apiKey, model = 'openai/gpt-3.5-turbo') {
  console.log('Sending messages to OpenRouter:', messages);

  // Prepend system message
  const fullMessages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant analyzing web content.'
    },
    ...messages
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': chrome.runtime.getManifest().homepage_url,
      'X-Title': chrome.runtime.getManifest().name
    },
    body: JSON.stringify({
      model: model,  
      messages: fullMessages
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
  
  return data.choices[0].message.content;
}
