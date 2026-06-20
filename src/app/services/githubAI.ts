// src/app/services/githubAI.ts
import OpenAI from 'openai';

export async function analyzeChartWithGitHubAI(
  imageData: string, 
  pair?: string, 
  timeframe?: string,
  tradeStyle: string = "SCALP"
) {
  try {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GitHub token not configured. Add VITE_GITHUB_TOKEN to your .env file');
    }

    const client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: token,
      dangerouslyAllowBrowser: true
    });

    console.log('📤 Analyzing chart with GitHub AI (GPT-4o)...');
    console.log(`📊 Trade Style: ${tradeStyle}`);

    // SMC and Trade Style specific prompts
    const tradeStyleConfig = tradeStyle === "SCALP" 
      ? {
          name: "SCALP",
          timeframe: "M1-M15",
          stopLoss: "10-20 pips",
          target: "10-30 pips",
          riskReward: "1:1 to 1:1.5",
          focus: "short-term momentum, order blocks, FVG (Fair Value Gaps)",
          entryStyle: "aggressive entries on order block breaks or FVG fills",
          tradeDuration: "15-60 minutes"
        }
      : {
          name: "SWING",
          timeframe: "H1-D1",
          stopLoss: "50-100+ pips",
          target: "100-300+ pips",
          riskReward: "1:2 to 1:4",
          focus: "higher timeframe structure, daily/weekly levels, institutional order flow",
          entryStyle: "conservative entries on pullbacks to key SMC levels",
          tradeDuration: "days to weeks"
        };

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional Smart Money Concepts (SMC) forex and commodity technical analyst.

TRADE STYLE: ${tradeStyleConfig.name} TRADING
- Timeframe Focus: ${tradeStyleConfig.timeframe}
- Stop Loss: ${tradeStyleConfig.stopLoss}
- Target: ${tradeStyleConfig.target}
- Risk/Reward: ${tradeStyleConfig.riskReward}
- Focus: ${tradeStyleConfig.focus}
- Entry Style: ${tradeStyleConfig.entryStyle}
- Trade Duration: ${tradeStyleConfig.tradeDuration}

SMC ANALYSIS FRAMEWORK:
1. MARKET STRUCTURE:
   - Break of Structure (BOS)
   - Change of Character (CHoCH)
   - Higher Highs/Higher Lows (Bullish) or Lower Highs/Lower Lows (Bearish)

2. ORDER BLOCKS & FVGS:
   - Bullish Order Blocks (last down candle before strong up move)
   - Bearish Order Blocks (last up candle before strong down move)
   - Fair Value Gaps (FVG) - Imbalances in price

3. LIQUIDITY:
   - Buy-side liquidity (above recent highs)
   - Sell-side liquidity (below recent lows)
   - Equal highs/lows (liquidity grabs)

4. SUPPLY & DEMAND ZONES:
   - Supply zones (resistance areas)
   - Demand zones (support areas)
   - Zone strength (fresh vs tested)

5. ENTRY & EXIT:
   - Entry: Order block break, FVG fill, liquidity sweep
   - Stop Loss: Beyond recent structure or order block
   - Take Profit: Next liquidity level or structure

SCORING SYSTEM (Total Confidence = Sum of all components, capped at 97%):

1. TREND STRUCTURE (0-30 pts): BOS/CHoCH, HH/HL or LH/LL, market structure
2. ORDER BLOCK/FVG (0-25 pts): Quality of order blocks, FVG fills, imbalance zones
3. LIQUIDITY ANALYSIS (0-25 pts): Liquidity sweeps, buy/sell-side liquidity
4. SUPPLY/DEMAND (0-20 pts): Key supply/demand zones, zone strength

RULES:
- ${tradeStyle === "SCALP" ? 'Tighter stops (10-20 pips), quicker exits, 1:1 to 1:1.5 R:R' : 'Wider stops (50-100+ pips), larger targets, 1:2 to 1:4 R:R'}
- ONLY enter if Risk/Reward >= 1:1.5
- Confidence = Sum of all components
- Cap confidence at 97%
- Use REAL values from the chart
- Identify and draw trendlines on the chart
- Identify and draw pattern structures`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart using Smart Money Concepts (SMC) and provide a complete technical analysis.

⚠️ YOU MUST LOOK AT THE CHART IMAGE. USE REAL VALUES.

STEP 1: Analyze MARKET STRUCTURE
- Identify Break of Structure (BOS) or Change of Character (CHoCH)
- Identify HH/HL (BULLISH) or LH/LL (BEARISH) structure
- Identify the current trend direction

STEP 2: Identify ORDER BLOCKS & FVGS
- Look for Bullish Order Blocks (last down candle before strong up move)
- Look for Bearish Order Blocks (last up candle before strong down move)
- Look for Fair Value Gaps (FVG) - price imbalances

STEP 3: Analyze LIQUIDITY
- Identify buy-side liquidity (above recent highs)
- Identify sell-side liquidity (below recent lows)
- Look for liquidity sweeps (wicks taking out liquidity)

STEP 4: Identify SUPPLY & DEMAND ZONES
- Supply zones (resistance areas)
- Demand zones (support areas)
- Zone strength (fresh vs tested)

STEP 5: Identify PATTERNS & TRENDLINES
- Look for chart patterns: double top, double bottom, head and shoulders, flags, etc.
- Draw trendlines connecting swing highs and swing lows
- Identify channel patterns

⚠️ CRITICAL: USE THE ACTUAL NUMBERS YOU SEE ON THE CHART

Based on what you ACTUALLY SEE, respond with ONLY this JSON format:

{
  "symbol": "THE_SYMBOL_FROM_CHART",
  "direction": "BUY or SELL or NO TRADE based on what you see",
  "trend": "BULLISH or BEARISH or NEUTRAL based on what you see",
  "confidence": 75,
  "entry": THE_ACTUAL_PRICE_ON_CHART,
  "sl": THE_ACTUAL_PRICE_ON_CHART - 20,
  "tp1": THE_ACTUAL_PRICE_ON_CHART + 20,
  "tp2": THE_ACTUAL_PRICE_ON_CHART + 40,
  "tp3": THE_ACTUAL_PRICE_ON_CHART + 60,
  "patterns": ["PATTERN_1", "PATTERN_2"],
  "support": SUPPORT_LEVEL_FROM_CHART,
  "resistance": RESISTANCE_LEVEL_FROM_CHART,
  "riskReward": 2.5,
  "explanation": "Your analysis based on what you see",
  "trendStrength": 80,
  "patternScore": 64,
  "volumeScore": 56,
  "breakout": false,
  "fakeoutRisk": false,
  "timeframe": "TIMEFRAME_FROM_CHART",
  "tradeStyle": "${tradeStyle}",
  "scoreComponents": {
    "trendStructure": 25,
    "orderBlockFVG": 20,
    "liquidityAnalysis": 18,
    "supplyDemand": 15
  },
  "smcData": {
    "marketStructure": "BULLISH or BEARISH or NEUTRAL",
    "bos": "Break of Structure detected: YES/NO",
    "choch": "Change of Character detected: YES/NO",
    "orderBlocks": ["Bullish Order Block at 1.0850", "Bearish Order Block at 1.0900"],
    "fvgs": ["FVG at 1.0870-1.0885"],
    "liquidity": ["Buy-side liquidity at 1.0920", "Sell-side liquidity at 1.0800"],
    "supplyDemandZones": [
      { "type": "supply", "level": 1.0900, "strength": "strong" },
      { "type": "demand", "level": 1.0820, "strength": "moderate" }
    ],
    "trendline": {
      "type": "ascending or descending or horizontal",
      "points": ["1.0850", "1.0880", "1.0910"]
    }
  }
}

EXAMPLE for SCALP (if you see XAU/USD at 4000):
- entry: 4000.00
- sl: 3995.00 (5 points - tight)
- tp1: 4005.00
- tp2: 4008.00
- tp3: 4012.00
- riskReward: 1.2

EXAMPLE for SWING (if you see XAU/USD at 4000):
- entry: 4000.00
- sl: 3970.00 (30 points - wider)
- tp1: 4030.00
- tp2: 4050.00
- tp3: 4080.00
- riskReward: 3.0

⚠️ DO NOT USE GENERIC VALUES. USE WHAT YOU SEE ON THE CHART.
⚠️ LOOK AT THE CHART IMAGE BEFORE RESPONDING.
⚠️ ONLY RESPOND WITH JSON, NOTHING ELSE.

${pair && pair !== "AUTO" ? `The chart shows: ${pair}` : 'Look at the chart to find the symbol'}
${timeframe && timeframe !== "AUTO" ? `Timeframe: ${timeframe}` : 'Look at the chart to find the timeframe'}
Trade Style: ${tradeStyle}

NOW LOOK AT THE CHART AND RESPOND WITH REAL SMC ANALYSIS VALUES.`
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
      temperature: 0.1,
      max_tokens: 4096,
      top_p: 1
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('📝 AI Response:', content.substring(0, 200) + '...');
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed result:', result);
      return result;
    }
    
    return { error: 'Failed to parse AI response', raw: content };
  } catch (error) {
    console.error('❌ GitHub AI error:', error);
    throw error;
  }
}