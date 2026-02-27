// Password validation endpoint
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

    try {
        const { password } = req.body;
        
        // Compare with environment variable
        const correctPassword = process.env.ADMIN_PASSWORD || 'sen@78';
        const valid = password === correctPassword;
        
        return res.status(200).json({ valid });
        
    } catch (error) {
        console.error('[Validate Error]', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
