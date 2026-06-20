// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageData, pair, timeframe } = req.body;
    const apiKey = process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
    
    if (!apiKey) {
      console.error('❌ NVIDIA_API_KEY not found');
      return res.status(500).json({ error: 'NVIDIA API key not configured' });
    }

    console.log('📤 Sending request to NVIDIA API...');
    console.log(`📊 Pair: ${pair || 'AUTO'}, Timeframe: ${timeframe || 'AUTO'}`);
    
    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    const payload = {
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert forex and commodity technical analyst. LOOK at this chart image VERY CAREFULLY.

CRITICAL INSTRUCTIONS:
1. LOOK at the chart image and find the ACTUAL prices shown on the price axis
2. LOOK for the SYMBOL/PAIR name (e.g., XAU/USD, EUR/USD, BTC/USD, US30, NAS100)
3. LOOK for the TIMEFRAME (M1, M5, M15, H1, H4, D1, W1, MN)
4. LOOK at the price action to determine TREND direction

Based on what you ACTUALLY SEE in the chart, respond with ONLY this JSON format:

{
  "symbol": "EXACT_SYMBOL_FROM_CHART",
  "direction": "BUY",
  "trend": "BULLISH",
  "confidence": 75,
  "entry": 0.0000,
  "sl": 0.0000,
  "tp1": 0.0000,
  "tp2": 0.0000,
  "tp3": 0.0000,
  "patterns": ["Pattern1", "Pattern2"],
  "support": 0.0000,
  "resistance": 0.0000,
  "riskReward": 2.5,
  "explanation": "Brief explanation based on what you see",
  "trendStrength": 80,
  "patternScore": 64,
  "volumeScore": 56,
  "breakout": false,
  "fakeoutRisk": false,
  "timeframe": "H1"
}

IMPORTANT RULES:
- Use the ACTUAL prices you see on the chart's price axis
- Use the ACTUAL symbol name you see on the chart
- If the chart shows XAU/USD at 4000, use 4000 as entry
- If the chart shows US30 at 39150, use 39150 as entry
- DO NOT use generic values - use what you SEE
- Respond ONLY with the JSON, nothing else

${pair && pair !== "AUTO" ? `The user selected: ${pair}` : 'Detect the symbol from the chart'}
${timeframe && timeframe !== "AUTO" ? `The user selected timeframe: ${timeframe}` : 'Detect the timeframe from the chart'}

YOU MUST LOOK AT THE CHART IMAGE AND EXTRACT REAL VALUES.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      max_tokens: 512,
      temperature: 0.1,
      top_p: 1.00,
      frequency_penalty: 0.00,
      presence_penalty: 0.00,
      stream: false
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after 90 seconds');
      controller.abort();
    }, 90000);

    try {
      const response = await fetch(invokeUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NVIDIA API error:', errorText);
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      console.log('✅ AI Response received');
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('📊 Parsed response:', parsed);
          return res.json(parsed);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          return res.json({ error: 'Failed to parse AI response', raw: content });
        }
      }
      
      return res.json({ error: 'No JSON found in response', raw: content });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏰ Request timeout after 90 seconds');
        return res.status(408).json({ error: 'Request timeout - AI took too long to respond. Please try again.' });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});