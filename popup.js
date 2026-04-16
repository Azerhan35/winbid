const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const result = document.getElementById('result');
const status = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');
const profileInput = document.getElementById('profile');

chrome.storage.local.get(['apiKey', 'profile'], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.profile) profileInput.value = data.profile;
});

generateBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const profile = profileInput.value.trim();

  if (!apiKey) {
    status.textContent = 'Please enter your API key.';
    return;
  }

  chrome.storage.local.set({ apiKey, profile });

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
    }
      
    
    

    chrome.tabs.sendMessage(tab.id, { action: 'getJobDetails' }, async (response) => {
      if (!response || !response.jobDetails) {
        status.textContent = 'Could not read job post. Please refresh and try again.';
        generateBtn.disabled = false;
        return;
      }

      status.textContent = 'Generating proposal...';

      const jobDetails = response.jobDetails;

      const prompt = `You are an experienced freelancer. Write a personalized, professional and compelling proposal for the following job post. Always write the proposal in English, regardless of the job post language.

İş İlanı:
${jobDetails}

${profile ? `Freelancer Profili:\n${profile}` : ''}

Teklif şu özelliklere sahip olsun:
- İlk cümle ilanla doğrudan ilgili olsun, "Dear Client" ile başlama
- 150-200 kelime arası olsun
- Somut değer öner
- Samimi ve özgün bir ton kullan
- Sonda kısa bir soru sor`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 400,
            temperature: 0.7
          })
        });

        const data = await res.json();

        if (data.error) {
          status.textContent = 'Hata: ' + data.error.message;
          generateBtn.disabled = false;
          return;
        }

        const proposal = data.choices[0].message.content;
        result.value = proposal;
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