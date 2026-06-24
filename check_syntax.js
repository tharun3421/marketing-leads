const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Portals', 'SalesPortal.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// A very simple JSX tag scanner that ignores comments and string literals
let stack = [];
let idx = 0;

// Regex to find tags
// <(\/)?([a-zA-Z0-9]+)(?:[^>]*(\/)?>)?
// But wait, let's just do a manual character scan to skip comments/strings
let insideComment = false;
let insideString = false;
let stringChar = null;

while (idx < content.length) {
  // Check comments
  if (!insideString) {
    if (content.slice(idx, idx + 2) === '/*') {
      insideComment = true;
      idx += 2;
      continue;
    }
    if (content.slice(idx, idx + 2) === '*/') {
      insideComment = false;
      idx += 2;
      continue;
    }
    if (content.slice(idx, idx + 2) === '//') {
      // Line comment, skip to end of line
      while (idx < content.length && content[idx] !== '\n') {
        idx++;
      }
      continue;
    }
  }

  if (insideComment) {
    idx++;
    continue;
  }

  // Check strings
  const char = content[idx];
  if ((char === '"' || char === "'" || char === '`') && (idx === 0 || content[idx-1] !== '\\')) {
    if (insideString && char === stringChar) {
      insideString = false;
      stringChar = null;
    } else if (!insideString) {
      insideString = true;
      stringChar = char;
    }
    idx++;
    continue;
  }

  if (insideString) {
    idx++;
    continue;
  }

  // Match JSX tags
  if (char === '<') {
    // Check if it is a tag
    const nextChar = content[idx + 1];
    if (/[a-zA-Z/]/.test(nextChar)) {
      // Find end of tag
      let endIdx = idx;
      while (endIdx < content.length && content[endIdx] !== '>') {
        endIdx++;
      }
      const tagContent = content.slice(idx, endIdx + 1);
      
      // Parse tag content
      const isClose = tagContent.startsWith('</');
      const isSelfClosing = tagContent.endsWith('/>');
      
      const match = tagContent.match(/<(\/)?([a-zA-Z0-9.-]+)/);
      if (match) {
        const tagName = match[2];
        
        // Skip some standard HTML self-closing elements if not written with />
        const selfClosingHTML = ['img', 'input', 'br', 'hr', 'meta', 'link'];
        
        if (!isSelfClosing && !selfClosingHTML.includes(tagName)) {
          if (isClose) {
            if (stack.length === 0) {
              console.log(`Unmatched closing tag: ${tagContent} at index ${idx}`);
            } else {
              const popped = stack.pop();
              if (popped.name !== tagName) {
                console.log(`Mismatched tags: opened <${popped.name}> at index ${popped.index}, closed with <${tagName}> at index ${idx}`);
              }
            }
          } else {
            stack.push({ name: tagName, index: idx });
          }
        }
      }
      idx = endIdx;
    }
  }
  idx++;
}

console.log(`Remaining open tags on stack: ${stack.length}`);
stack.forEach(t => {
  // Print line number
  const linesBefore = content.slice(0, t.index).split('\n');
  const lineNo = linesBefore.length;
  console.log(`  <${t.name}> opened at line ${lineNo}`);
});
