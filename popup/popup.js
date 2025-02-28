// State management
let settings = {
  openrouterKey: '',
  features: {
    summarization: false,
    modelCompare: false,
    citations: false,
    export: false
  }
};

// DOM Elements
const settingsBtn = document.querySelector('.settings-btn');
const settingsPanel = document.querySelector('.settings-panel');
const apiKeyInput = document.getElementById('openrouter-key');
const saveSettingsBtn = document.getElementById('save-settings');
const userInput = document.getElementById('user-input');
const sendMessageBtn = document.getElementById('send-message');
const conversationTree = document.getElementById('conversation-tree');

// Feature toggles
const featureToggles = {
  summarization: document.getElementById('enable-summarization'),
  modelCompare: document.getElementById('enable-model-compare'),
  citations: document.getElementById('enable-citations'),
  export: document.getElementById('enable-export')
};

// Initialize settings from storage
chrome.storage.local.get(['settings'], (result) => {
  if (result.settings) {
    settings = result.settings;
    updateUI();
  }
});

// Settings panel toggle
settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

// Save settings
saveSettingsBtn.addEventListener('click', async () => {
  settings.openrouterKey = apiKeyInput.value;
  settings.features = {
    summarization: featureToggles.summarization.checked,
    modelCompare: featureToggles.modelCompare.checked,
    citations: featureToggles.citations.checked,
    export: featureToggles.export.checked
  };

  await chrome.storage.local.set({ settings });
  settingsPanel.classList.add('hidden');
});

// Update UI with current settings
function updateUI() {
  apiKeyInput.value = settings.openrouterKey;
  for (const [feature, element] of Object.entries(featureToggles)) {
    element.checked = settings.features[feature];
  }
}

// Store the current context
let currentContext = null;

// Load any stored context when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded, fetching context from storage...');
  
  try {
    // Get stored context and selection
    const result = await chrome.storage.local.get(['pageContext', 'currentSelection', 'settings']);
    console.log('Storage data loaded:', result);
    
    if (result.settings) {
      settings = result.settings;
      updateUI();
    }
    
    // Make sure we have valid context data
    if (result.pageContext && typeof result.pageContext === 'object') {
      console.log('Found page context:', result.pageContext);
      currentContext = result.pageContext;
      
      // Create a context display element if there's context to show
      if (currentContext.selectedText) {
        const contextDisplay = document.createElement('div');
        contextDisplay.className = 'context-display';
        
        // Create and style the context content
        const contextContent = document.createElement('div');
        contextContent.className = 'context-content';
        
        // Add formatted context if available, otherwise just the selection
        if (currentContext.formattedContext) {
          contextContent.innerHTML = currentContext.formattedContext
            .replace(new RegExp(`"${currentContext.selectedText}"`, 'g'), 
                     `"<mark>${currentContext.selectedText}</mark>"`);
        } else {
          contextContent.innerHTML = `Selected text: "<mark>${currentContext.selectedText}</mark>"`;
        }
        
        contextDisplay.appendChild(contextContent);
        
        // Insert at the top of the chat container
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.insertBefore(contextDisplay, chatContainer.firstChild);
        
        // Pre-fill the input field with a prompt
        userInput.value = `About this text: "${currentContext.selectedText.substring(0, 30)}${currentContext.selectedText.length > 30 ? '...' : ''}"\n\n`;
        userInput.focus();
      } else {
        console.warn('Context found but no selectedText property:', currentContext);
      }
    } else {
      console.warn('No valid page context found in storage');
      
      // Fall back to the currentSelection if available
      if (result.currentSelection && result.currentSelection.text) {
        console.log('Using currentSelection as fallback:', result.currentSelection);
        
        // Create a minimal context object
        currentContext = {
          selectedText: result.currentSelection.text,
          surroundingParagraph: result.currentSelection.text
        };
        
        // Display minimal context
        const contextDisplay = document.createElement('div');
        contextDisplay.className = 'context-display';
        
        const contextContent = document.createElement('div');
        contextContent.className = 'context-content';
        contextContent.innerHTML = `Selected text: "<mark>${result.currentSelection.text}</mark>"`;
        
        contextDisplay.appendChild(contextContent);
        
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.insertBefore(contextDisplay, chatContainer.firstChild);
        
        // Pre-fill the input field
        userInput.value = `About this text: "${result.currentSelection.text.substring(0, 30)}${result.currentSelection.text.length > 30 ? '...' : ''}"\n\n`;
        userInput.focus();
      } else {
        console.warn('No selection data found either');
      }
    }
  } catch (error) {
    console.error('Error loading context:', error);
  }
});

// Send message handler
sendMessageBtn.addEventListener('click', async () => {
  const message = userInput.value.trim();
  if (!message) return;

  if (!settings.openrouterKey) {
    alert('Please set your OpenRouter API key in settings');
    return;
  }

  // If we don't have a context yet, try to get it from storage one more time
  if (!currentContext) {
    console.log('No context found before sending message, trying to fetch from storage...');
    const result = await chrome.storage.local.get(['pageContext', 'currentSelection']);
    if (result.pageContext) {
      console.log('Retrieved context from storage:', result.pageContext);
      currentContext = result.pageContext;
    } else if (result.currentSelection) {
      console.log('Using selection as minimal context:', result.currentSelection);
      currentContext = {
        selectedText: result.currentSelection.text,
        surroundingParagraph: result.currentSelection.text
      };
    }
  }

  console.log('Sending message with context:', currentContext);

  try {
    // Send message to background script with context
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_MESSAGE',
      payload: {
        message,
        settings,
        context: currentContext
      }
    });

    // Handle response
    if (response.error) {
      throw new Error(response.error);
    }

    // Clear input
    userInput.value = '';

    // Update conversation tree
    updateConversationTree({
      question: message,
      answer: response.text,
      context: currentContext
    });
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message. Please try again.');
  }
});

// Update conversation tree
function updateConversationTree({ question, answer, context }) {
  const thread = document.createElement('div');
  thread.className = 'conversation-thread';

  // Add context if available
  if (context) {
    const contextElement = document.createElement('div');
    contextElement.className = 'context';
    contextElement.textContent = `Selection: "${context.selectedText}"`;
    thread.appendChild(contextElement);
  }

  // Add question
  const questionElement = document.createElement('div');
  questionElement.className = 'message question';
  questionElement.textContent = question;
  thread.appendChild(questionElement);

  // Add answer
  const answerElement = document.createElement('div');
  answerElement.className = 'message answer';
  answerElement.textContent = answer;
  thread.appendChild(answerElement);

  conversationTree.appendChild(thread);
  conversationTree.scrollTop = conversationTree.scrollHeight;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SELECTION_CONTEXT') {
    currentContext = message;
    
    // Update UI with the context if the popup is already open
    const existingContextDisplay = document.querySelector('.context-display');
    if (!existingContextDisplay) {
      const contextDisplay = document.createElement('div');
      contextDisplay.className = 'context-display';
      
      const contextContent = document.createElement('div');
      contextContent.className = 'context-content';
      
      // Add formatted context if available
      if (message.formattedContext) {
        contextContent.innerHTML = message.formattedContext
          .replace(new RegExp(`"${message.selectedText}"`, 'g'), 
                   `"<mark>${message.selectedText}</mark>"`);
      } else {
        contextContent.innerHTML = `Selected text: "<mark>${message.selectedText}</mark>"`;
      }
      
      contextDisplay.appendChild(contextContent);
      
      const chatContainer = document.querySelector('.chat-container');
      chatContainer.insertBefore(contextDisplay, chatContainer.firstChild);
    }
    
    userInput.value = `About this text: "${message.selectedText.substring(0, 30)}${message.selectedText.length > 30 ? '...' : ''}"\n\n`;
    userInput.focus();
  }
  return true;
});
