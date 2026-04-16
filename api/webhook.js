import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const resendKey = process.env.RESEND_API_KEY;

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return 'WINBID-' + segments.join('-');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Gumroad sends sale data
    const email = payload.email;
    const productName = payload.product_name;

    if (!email) {
      return res.status(400).json({ error: 'No email provided' });
    }

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Save to Supabase
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        key: licenseKey,
        email: email,
        active: true
      })
    });

    if (!dbResponse.ok) {
      return res.status(500).json({ error: 'Failed to save license' });
    }

    // Send email with license key via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'WinBid <onboarding@resend.dev>',
        to: email,
        subject: 'Your WinBid License Key',
        html: `
          <h2>Welcome to WinBid!</h2>
          <p>Thank you for your purchase. Here is your license key:</p>
          <h1 style="background:#5b4fd4;color:white;padding:20px;border-radius:8px;text-align:center;letter-spacing:4px">${licenseKey}</h1>
          <p>To activate:</p>
          <ol>
            <li>Install the WinBid Chrome extension</li>
            <li>Open any job post on Upwork, Freelancer or Fiverr</li>
            <li>Click WinBid, enter your license key</li>
            <li>Click Generate WinBid!</li>
          </ol>
          <p>Need help? Reply to this email.</p>
        `
      })
    });

    return res.status(200).json({ success: true, licenseKey });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}