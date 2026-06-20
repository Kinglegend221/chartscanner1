// src/app/services/nvidiaProxy.ts

export async function analyzeChartWithNVIDIAProxy(imageData: string, pair?: string, timeframe?: string) {
  try {
    console.log('📤 Sending request to proxy server...');
    console.log(`📊 Image data size: ${Math.round(imageData.length / 1024)}KB`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Proxy request timeout after 90 seconds');
      controller.abort();
    }, 90000);

    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData,
        pair,
        timeframe
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Proxy error:', error);
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Proxy response received');
    return result;
  } catch (error) {
    console.error('❌ Proxy API error:', error);
    
    // Check if it's an AbortError (timeout)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 90 seconds. The AI is taking too long. Please try again with a smaller image or try later.');
      }
      // If it's any other Error, re-throw it
      throw error;
    }
    
    // If it's not an Error object, throw a generic error
    throw new Error('An unknown error occurred while analyzing the chart');
  }
}