// NVIDIA AI chat endpoint
const MODEL_MAP = {
    fast: 'meta/llama-3.1-8b-instruct',
    balanced: 'meta/llama-3.1-70b-instruct',
    smart: 'mistralai/mixtral-8x22b-instruct',
    pro: 'meta/llama-3.1-405b-instruct',
    experimental: 'deepseek-ai/deepseek-v3.2'
};

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
        const { message, character, model, systemPrompt, history } = req.body;

        if (!message || !character || !model || !systemPrompt) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const apiKey = process.env.NVIDIA_API_KEY;
        
        if (!apiKey) {
            console.error('[Backend] NVIDIA_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const modelId = MODEL_MAP[model] || MODEL_MAP.balanced;
        
        console.log(`[Backend] Request: character=${character}, model=${model}`);

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        if (history && Array.isArray(history)) {
            messages.push(...history.slice(-30));
        }

        messages.push({
            role: 'user',
            content: message
        });

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId,
                messages: messages,
                temperature: 0.7,
                top_p: 0.95,
                max_tokens: 1024,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`[Backend] NVIDIA API Error (${response.status}):`, errorData);
            
            if (response.status === 429) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            }
            
            return res.status(response.status).json({ error: 'AI service error' });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('[Backend] Unexpected response:', data);
            return res.status(500).json({ error: 'Invalid AI response' });
        }

        const aiResponse = data.choices[0].message.content;

        return res.status(200).json({
            response: aiResponse,
            metadata: {
                model: modelId,
                mode: model
            }
        });

    } catch (error) {
        console.error('[Backend] Error:', error);
        return res.status(500).json({ error: 'Request failed' });
    }
}
