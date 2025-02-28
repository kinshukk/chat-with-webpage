// DOM Parser module for extracting and processing webpage content

class DOMParser {
  constructor() {
    this.articleContent = null;
  }

  /**
   * Extract main article content from the page
   * TODO: Implement Readability.js integration
   */
  extractArticle() {
    // Placeholder for Readability.js implementation
    const article = document.querySelector('article') || document.body;
    return {
      title: document.title,
      content: article.textContent,
      url: window.location.href
    };
  }

  /**
   * Get context around a selected text
   * @param {string} selectedText - The text selected by the user
   * @returns {Object} Context information including surrounding content
   */
  getSelectionContext(selectedText) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Get parent element if text node
    const parentElement = container.nodeType === 3 ? container.parentElement : container;

    return {
      selectedText,
      surroundingParagraph: this.getSurroundingParagraph(parentElement),
      headings: this.getRelevantHeadings(parentElement),
      path: this.getElementPath(parentElement)
    };
  }

  /**
   * Get the full paragraph or block containing the selection
   */
  getSurroundingParagraph(element) {
    const blockElement = this.findClosestBlock(element);
    return blockElement ? blockElement.textContent.trim() : '';
  }

  /**
   * Find closest block-level element
   */
  findClosestBlock(element) {
    const blockElements = [
      'P', 'DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER',
      'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'
    ];

    while (element && !blockElements.includes(element.tagName)) {
      element = element.parentElement;
    }

    return element;
  }

  /**
   * Get relevant headings above the selected content
   */
  getRelevantHeadings(element) {
    const headings = [];
    let current = element;

    while (current && current.tagName !== 'BODY') {
      const prevHeading = this.findPreviousHeading(current);
      if (prevHeading) {
        headings.unshift(prevHeading.textContent.trim());
      }
      current = current.parentElement;
    }

    return headings;
  }

  /**
   * Find the nearest previous heading element
   */
  findPreviousHeading(element) {
    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    let current = element;

    while (current && current.tagName !== 'BODY') {
      let sibling = current.previousElementSibling;
      
      while (sibling) {
        if (headingTags.includes(sibling.tagName)) {
          return sibling;
        }
        sibling = sibling.previousElementSibling;
      }
      
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Get DOM path to element for context
   */
  getElementPath(element) {
    const path = [];
    let current = element;

    while (current && current.tagName !== 'BODY') {
      path.unshift({
        tag: current.tagName.toLowerCase(),
        className: current.className,
        id: current.id
      });
      current = current.parentElement;
    }

    return path;
  }
}

// Export instance
window.domParser = new DOMParser();