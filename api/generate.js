

const openaiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey, jobDetails, profile } = req.body;

  if (!licenseKey || !jobDetails) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify license key in Supabase
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/licenses?key=eq.${licenseKey}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const licenses = await response.json();

    if (!licenses || licenses.length === 0) {
      return res.status(401).json({ error: 'Invalid license key' });
    }

    const license = licenses[0];

    if (!license.active) {
      return res.status(401).json({ error: 'License is not active' });
    }

  } catch (err) {
    return res.status(500).json({ error: 'License verification failed' });
  }

  // Generate proposal
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `You are an experienced freelancer. Write a personalized, professional and compelling proposal for the following job post. Always write in English.

Job Post:
${jobDetails}

${profile ? `Freelancer Profile:\n${profile}` : ''}

Write a 150-200 word proposal. Start with something specific to the job. End with a question.`
        }],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const proposal = data.choices[0].message.content;
    return res.status(200).json({ proposal });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate proposal' });
  }
}