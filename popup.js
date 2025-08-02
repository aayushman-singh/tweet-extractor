let lastResult = null;

// Example scripts
const examples = {
  title: `// Get page title and URL
return {
  title: document.title,
  url: window.location.href,
  timestamp: new Date().toISOString()
};`,
  
  links: `// Get all links on the page
const links = Array.from(document.querySelectorAll('a')).map(link => ({
  text: link.textContent.trim(),
  href: link.href,
  title: link.title
}));

return {
  totalLinks: links.length,
  links: links.slice(0, 50) // Limit to first 50 links
};`,
  
  images: `// Get all images on the page
const images = Array.from(document.querySelectorAll('img')).map(img => ({
  src: img.src,
  alt: img.alt,
  width: img.width,
  height: img.height
}));

return {
  totalImages: images.length,
  images: images.slice(0, 30) // Limit to first 30 images
};`,
  
  custom: `// Custom data extraction example
const data = {
  pageInfo: {
    title: document.title,
    url: window.location.href,
    description: document.querySelector('meta[name="description"]')?.content || 'No description',
    keywords: document.querySelector('meta[name="keywords"]')?.content || 'No keywords'
  },
  headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
    level: h.tagName,
    text: h.textContent.trim()
  })),
  forms: Array.from(document.querySelectorAll('form')).map(form => ({
    action: form.action,
    method: form.method,
    inputs: Array.from(form.querySelectorAll('input')).map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder
    }))
  }))
};

return data;`
};

// Load example scripts
function loadExample(type) {
  const textarea = document.getElementById('scriptInput');
  textarea.value = examples[type];
  showStatus('Example loaded!', 'success');
}

// Show status message
function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

// Run the JavaScript script
async function runScript() {
  const scriptInput = document.getElementById('scriptInput');
  const script = scriptInput.value.trim();
  
  if (!script) {
    showStatus('Please enter some JavaScript code!', 'error');
    return;
  }
  
  try {
    showStatus('Running script...', 'success');
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute the script in the content script
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'executeScript',
      script: script
    });
    
    if (result.success) {
      lastResult = result.data;
      showStatus('Script executed successfully!', 'success');
    } else {
      showStatus(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// Download result as HTML
function downloadResult() {
  if (!lastResult) {
    showStatus('No result to download! Run a script first.', 'error');
    return;
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `js-script-result-${timestamp}.html`;
    
    // Create HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JS Script Result</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .result {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #667eea;
        }
        .timestamp {
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 JS Script Runner - Result</h1>
        <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>
    </div>
    <div class="result">
        <h2>Script Output:</h2>
        <pre>${JSON.stringify(lastResult, null, 2)}</pre>
    </div>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    
    showStatus('Download started!', 'success');
  } catch (error) {
    showStatus(`Download error: ${error.message}`, 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('runBtn').addEventListener('click', runScript);
  document.getElementById('downloadBtn').addEventListener('click', downloadResult);
  
  // Allow Ctrl+Enter to run script
  document.getElementById('scriptInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      runScript();
    }
  });
}); 