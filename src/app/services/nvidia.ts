// src/app/services/nvidia.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeChartWithGemini(imageData: string, pair?: string, timeframe?: string) {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this forex chart and provide a detailed technical analysis. Include:
1. Current trend direction (BULLISH/BEARISH/NEUTRAL)
2. Trade recommendation (BUY/SELL/NO TRADE)
3. Confidence level (0-100)
4. Key support and resistance levels (as numbers)
5. Entry price, Stop Loss, and Take Profit levels (as numbers)
6. Detected chart patterns (as array of strings)
7. Risk/Reward ratio (as number)
8. Brief analysis explanation

${pair ? `Pair: ${pair}` : 'Pair: EUR/USD'}
${timeframe ? `Timeframe: ${timeframe}` : 'Timeframe: H1'}

IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
{
  "direction": "BUY",
  "trend": "BULLISH",
  "confidence": 75,
  "entry": 1.0856,
  "sl": 1.0830,
  "tp1": 1.0880,
  "tp2": 1.0900,
  "tp3": 1.0925,
  "patterns": ["Double Bottom", "Bull Flag"],
  "support": 1.0820,
  "resistance": 1.0900,
  "riskReward": 2.5,
  "explanation": "Brief analysis explanation here"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/png'
        }
      }
    ]);
    
    const response = result.response.text();
    console.log('📝 Gemini Response:', response.substring(0, 200) + '...');
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { error: 'Failed to parse AI response', raw: response };
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Gemini API failed: ${errorMessage}`);
  }
}