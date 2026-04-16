const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const result = document.getElementById('result');
const status = document.getElementById('status');
const licenseInput = document.getElementById('apiKey');
const profileInput = document.getElementById('profile');

chrome.storage.local.get(['licenseKey', 'profile'], (data) => {
  if (data.licenseKey) licenseInput.value = data.licenseKey;
  if (data.profile) profileInput.value = data.profile;
});

generateBtn.addEventListener('click', async () => {
  const licenseKey = licenseInput.value.trim();
  const profile = profileInput.value.trim();

  if (!licenseKey) {
    status.textContent = 'Please enter your license key.';
    return;
  }

  chrome.storage.local.set({ licenseKey, profile });

  generateBtn.disabled = true;
  status.textContent = 'Reading job post...';
  result.style.display = 'none';
  copyBtn.style.display = 'none';

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];

    const supportedSites = ['upwork.com', 'freelancer.com', 'fiverr.com', 'guru.com', 'peopleperhour.com'];
    const isSupported = supportedSites.some(site => tab.url.includes(site));

    if (!isSupported) {
      status.textContent = 'Please open a job post on Upwork, Freelancer, Fiverr, Guru or PeoplePerHour.';
      generateBtn.disabled = false;
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'getJobDetails' }, async (response) => {
      if (!response || !response.jobDetails) {
        status.textContent = 'Could not read job post. Please refresh and try again.';
        generateBtn.disabled = false;
        return;
      }

      status.textContent = 'Generating proposal...';

      try {
        const res = await fetch('https://winbid-flame.vercel.app/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey,
            jobDetails: response.jobDetails,
            profile
          })
        });

        const data = await res.json();

        if (data.error) {
          status.textContent = 'Error: ' + data.error;
          generateBtn.disabled = false;
          return;
        }

        result.value = data.proposal;
        result.style.display = 'block';
        copyBtn.style.display = 'block';
        status.textContent = 'Proposal ready!';
        generateBtn.disabled = false;

      } catch (err) {
        status.textContent = 'Connection error. Please check your internet.';
        generateBtn.disabled = false;
      }
    });
  });
});

copyBtn.addEventListener('click', () => {
  result.select();
  document.execCommand('copy');
  copyBtn.textContent = 'Copied!';
  setTimeout(() => copyBtn.textContent = 'Copy', 2000);
});