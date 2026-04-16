chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJobDetails') {
    const jobDetails = getJobDetails();
    sendResponse({ jobDetails });
  }
  return true;
});

function getJobDetails() {
  const url = window.location.href;
  let details = '';

  // Try all possible title selectors
  const titleSelectors = ['h1', '[data-test="job-title"]', '.job-title', '[class*="title"]'];
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      details += 'Title: ' + el.innerText.trim() + '\n\n';
      break;
    }
  }

  // Try all possible description selectors
  const descSelectors = [
    '[data-test="description"]',
    '.job-description',
    '[class*="description"]',
    '[class*="Description"]',
    '.up-card-section',
    '[data-v-app]',
    'section',
    'article',
    'main'
  ];
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 100) {
      details += 'Description: ' + el.innerText.trim().slice(0, 2000) + '\n\n';
      break;
    }
  }

  // If nothing found, grab page body text
  if (!details || details.length < 50) {
    details = document.body.innerText.slice(0, 3000);
  }

  return details;
}