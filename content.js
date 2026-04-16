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

  if (url.includes('upwork.com')) {
    const title = document.querySelector('h1, [data-test="job-title"]');
    if (title) details += 'Title: ' + title.innerText.trim() + '\n\n';

    const description = document.querySelector(
      '[data-test="description"], .job-description, [class*="description"]'
    );
    if (description) details += 'Description: ' + description.innerText.trim().slice(0, 1500) + '\n\n';

    const skills = document.querySelectorAll('[data-test="skill"], .skill, [class*="skill"]');
    if (skills.length > 0) {
      details += 'Skills: ' + Array.from(skills).map(s => s.innerText.trim()).join(', ') + '\n\n';
    }

    const budget = document.querySelector('[data-test="budget"], [class*="budget"], [class*="price"]');
    if (budget) details += 'Budget: ' + budget.innerText.trim() + '\n\n';

  } else if (url.includes('freelancer.com')) {
    const title = document.querySelector('h1, .project-title, [class*="title"]');
    if (title) details += 'Title: ' + title.innerText.trim() + '\n\n';

    const description = document.querySelector('.project-description, [class*="description"], #project-description');
    if (description) details += 'Description: ' + description.innerText.trim().slice(0, 1500) + '\n\n';

    const skills = document.querySelectorAll('.skill-tag, [class*="skill"]');
    if (skills.length > 0) {
      details += 'Skills: ' + Array.from(skills).map(s => s.innerText.trim()).join(', ') + '\n\n';
    }

  } else if (url.includes('fiverr.com')) {
    const title = document.querySelector('h1, .gig-title, [class*="title"]');
    if (title) details += 'Title: ' + title.innerText.trim() + '\n\n';

    const description = document.querySelector('.description-content, [class*="description"]');
    if (description) details += 'Description: ' + description.innerText.trim().slice(0, 1500) + '\n\n';

  } else if (url.includes('guru.com')) {
    const title = document.querySelector('h1, .jobTitle, [class*="title"]');
    if (title) details += 'Title: ' + title.innerText.trim() + '\n\n';

    const description = document.querySelector('.jobDescription, [class*="description"]');
    if (description) details += 'Description: ' + description.innerText.trim().slice(0, 1500) + '\n\n';

  } else if (url.includes('peopleperhour.com')) {
    const title = document.querySelector('h1, [class*="title"]');
    if (title) details += 'Title: ' + title.innerText.trim() + '\n\n';

    const description = document.querySelector('[class*="description"], [class*="brief"]');
    if (description) details += 'Description: ' + description.innerText.trim().slice(0, 1500) + '\n\n';
  }

  if (!details) {
    details = document.body.innerText.slice(0, 2000);
  }

  return details;
}