export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  try {
    // Gumroad sends form-encoded data
    let email, productName;
    
    if (typeof req.body === 'string') {
      const params = new URLSearchParams(req.body);
      email = params.get('email');
      productName = params.get('product_name');
    } else {
      email = req.body?.email;
      productName = req.body?.product_name;
    }

    if (!email) {
      return res.status(400).json({ error: 'No email provided' });
    }

    // Generate license key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(segment);
    }
    const licenseKey = 'WINBID-' + segments.join('-');

    // Save to Supabase
    await fetch(`${supabaseUrl}/rest/v1/licenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ key: licenseKey, email, active: true })
    });

    // Send email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'WinBid <hello@getwinbid.com>',
        to: email,
        subject: 'Your WinBid License Key',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#5b4fd4">Welcome to WinBid!</h2>
            <p>Thank you for your purchase. Here is your license key:</p>
            <div style="background:#5b4fd4;color:white;padding:20px;border-radius:8px;text-align:center;font-size:20px;letter-spacing:4px;font-weight:bold">
              ${licenseKey}
            </div>
            <h3>How to activate:</h3>
            <ol>
              <li>Install the WinBid Chrome extension</li>
              <li>Open any job post on Upwork, Freelancer or Fiverr</li>
              <li>Click the WinBid icon and enter your license key</li>
              <li>Click Generate WinBid!</li>
            </ol>
            <p>Need help? Reply to this email anytime.</p>
          </div>
        `
      })
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}