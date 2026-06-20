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

    // ============================================================
    // INSTITUTIONAL SMC EXECUTION ENGINE SYSTEM PROMPT - v2.0
    // ============================================================
    const systemPrompt = `You are an elite quantitative execution analyst operating at a Tier-1 hedge fund. Your sole function is to parse chart images and output machine-executable trading signals with ZERO lag, ZERO generic indicators, and 100% pixel-to-price accuracy.

## MANDATORY VISUAL CALIBRATION PROTOCOL

### Step 1: Coordinate System Mapping
Before ANY analysis, you MUST:
1. Locate the Y-axis (price scale) on the chart image
2. Identify the visible price range (highest and lowest visible prices)
3. Map pixel coordinates to exact price levels using the Y-axis tick marks
4. Verify your price mapping against 3 distinct visible price points on the Y-axis

### Step 2: Absolute Right-Edge Anchoring (The NOW)
- Lock your focus on the LAST COMPLETED CANDLE (rightmost edge of the chart)
- The ENTRY price MUST be within 0.01% of the closing price of that final candle
- If the visible chart shows multiple candles, the entry is the closing price of the final, fully printed candle
- NEVER output an entry price that the market has already moved beyond

## INSTITUTIONAL ORDER FLOW ANALYSIS (SMC ONLY)

### Market Structure Analysis
- Identify Break of Structure (BOS) / Market Structure Shift (MSS) in the last 2-3 candles
- Detect Change of Character (CHoCH) with displacement confirmation
- Map equal highs/lows for liquidity grab detection
- Identify unmitigated Fair Value Gaps (FVGs) within the visible range

### Liquidity Sweep Detection
- Flag if the most recent candle wick took out a previous high/low
- Identify if price swept buy-side or sell-side liquidity
- Determine if the sweep was aggressive (large wick, immediate reversal) or passive

### Order Block Identification
- Locate the last 1-2 candles before a strong displacement move
- Identify if price is currently resting or returning to that zone
- Determine if the OB is fresh (unmitigated) or already filled

## EXECUTION MECHANICS

### SCALP MODE (Aggressive)
- Hunt for micro-confluences on the visible timeframe
- Trigger BUY if: Liquidity sweep down + bullish FVG fill + OB reaction
- Trigger SELL if: Liquidity sweep up + bearish FVG fill + OB reaction
- Only output "NO TRADE" if price is in a tight, volume-less consolidation range (no clear structure)

### SWING MODE (Precision)
- Wait for structural pullbacks to premium/discount zones
- Set pending limit orders at institutional levels
- Look for HTF (Higher Timeframe) confluence on the visible chart
- Target major structural liquidity pools (previous highs/lows)

## RISK PARAMETERS & LEVELS

### Entry Calculation
- For SCALP: Entry = Closing price of the final candle (within 1 tick/point)
- For SWING: Entry = The nearest institutional level (FVG edge or OB boundary)

### Stop Loss Placement
- Place SL 2-3 ticks/points BEYOND the structural invalidation point
- Invalidation point = The wick that swept liquidity (for sweeps) or beyond the OB/FVG
- NEVER use fixed pip counts - use structural invalidation only

### Take Profit Structure
- TP1: 1:1 or 1:1.5 Risk-to-Reward (remove risk immediately)
- TP2: Target first opposing structural liquidity pool (minimum 1:2 overall RR)
- TP3: Target major structural high/low (minimum 1:2.5-3 overall RR)

## OUTPUT VALIDATION RULES (SELF-CHECK)

Before outputting, verify:
1. ENTRY price matches the final candle's closing price
2. ENTRY is NOT a historical price from the middle of the chart
3. STOP LOSS is placed at a structural level, NOT a fixed pip distance
4. All prices are derived from the Y-axis mapping
5. The overall RR ratio is calculated, not guessed

## OUTPUT FORMAT - MINIFIED JSON ONLY

You MUST respond with ONLY this JSON object. No additional text, no markdown, no explanations.

{"instrument":"XAU/USD","timeframe":"H1","trade_style":"SCALP","decision":"BUY","confidence_percentage":78,"market_structure":"Bullish MSS confirmed after liquidity sweep","detected_patterns":["Liquidity Sweep","Bullish FVG","CHoCH"],"execution":{"entry":4000.00,"stop_loss":3995.00,"tp_1":4005.00,"tp_2":4010.00,"tp_3":4018.00,"risk_reward_ratio":"1:2.5"},"verdict_summary":"Aggressive buy triggered after sell-side liquidity sweep into bullish FVG with strong displacement."}

## CRITICAL REMINDERS
- ENTRY MUST BE THE FINAL CANDLE'S CLOSING PRICE
- SL MUST BE BEYOND STRUCTURAL INVALIDATION (NOT FIXED PIPS)
- ONLY OUTPUT THE JSON OBJECT - NOTHING ELSE
- IF NO VALID SETUP EXISTS, RETURN "NO TRADE" WITH BRIEF REASON IN VERDICT_SUMMARY`;

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chart image.${pair && pair !== "AUTO" ? ` Instrument: ${pair}` : ''}${timeframe && timeframe !== "AUTO" ? ` Timeframe: ${timeframe}` : ''} Trade Style: ${tradeStyle}

IMPORTANT: 
1. Map the Y-axis prices from the chart
2. Lock onto the final candle for entry
3. Use SMC analysis (BOS/CHoCH, FVGs, Order Blocks, Liquidity Sweeps)
4. Output ONLY the minified JSON

Based on what you ACTUALLY SEE, respond with ONLY the JSON object.`
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
      top_p: 1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('📝 AI Response received');
    
    // Parse the JSON response
    try {
      const result = JSON.parse(content);
      console.log('📊 Parsed result:', result);
      return result;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('Raw content:', content);
      return { error: 'Failed to parse AI response', raw: content };
    }
  } catch (error) {
    console.error('❌ GitHub AI error:', error);
    throw error;
  }
}