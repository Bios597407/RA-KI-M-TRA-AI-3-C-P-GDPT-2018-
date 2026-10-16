/**
 * Centralized Gemini AI Model Management & Fallback Logic
 * Version: 2025.10.15 - Strict HTTP 404 Prevention
 */

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * List of fallback models in priority order.
 * If the primary model (often gemini-2.5-flash) returns 404, we immediately try these.
 */
export const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

/**
 * Checks localStorage for deprecated models and overrides them with the new default.
 * This prevents the app from reloading old, broken model configurations.
 */
export function initializeAndClearModelCache(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const stored = localStorage.getItem(key);
      if (stored && (
        stored.includes('gemini-2.5-flash') || 
        stored.includes('gemini-1.5-flash') || 
        stored.includes('gemini-2.0-flash')
      )) {
        console.warn(`[AI System] Detected deprecated model reference in localStorage key "${key}". Overriding with "${DEFAULT_MODEL}".`);
        
        // If it's a JSON object (like our config), we should be careful, but the prompt says "ghi đè nó thành gemini-3-flash-preview ngay lập tức".
        // To be safe, if it looks like JSON, we try to parse and replace specific fields, otherwise we replace the whole string.
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            let changed = false;
            const deepReplace = (obj: any) => {
              for (const k in obj) {
                if (typeof obj[k] === 'string' && (obj[k].includes('gemini-2.5-flash') || obj[k].includes('gemini-1.5-flash') || obj[k].includes('gemini-2.0-flash'))) {
                  obj[k] = DEFAULT_MODEL;
                  changed = true;
                } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                  deepReplace(obj[k]);
                }
              }
            };
            deepReplace(parsed);
            if (changed) localStorage.setItem(key, JSON.stringify(parsed));
          } else {
            localStorage.setItem(key, DEFAULT_MODEL);
          }
        } catch {
          // Not JSON, just replace the string if it matches
          localStorage.setItem(key, DEFAULT_MODEL);
        }
      }
    }
  } catch (err) {
    console.error('Error clearing model cache:', err);
  }
}

/**
 * Generic Fetch Wrapper with Automatic Fallback for 404 / Unavailable Models
 */
export async function fetchGeminiWithFallback(
  requestBody: any,
  apiKey: string,
  options?: {
    temperature?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
    onModelTry?: (modelName: string) => void;
  }
): Promise<{ data: any; usedModel: string }> {
  let lastError = '';
  
  // Combine custom model (if any) with the fallback list, ensuring uniqueness and priority
  const candidates = Array.from(new Set([DEFAULT_MODEL, ...FALLBACK_MODELS]));

  for (const modelName of candidates) {
    if (options?.onModelTry) options.onModelTry(modelName);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            responseMimeType: options?.responseMimeType ?? 'application/json',
            maxOutputTokens: options?.maxOutputTokens ?? 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const lowerError = errorText.toLowerCase();
        
        // If 404 or model unavailable, continue to next model
        if (
          response.status === 404 || 
          lowerError.includes('not found') || 
          lowerError.includes('no longer available') ||
          lowerError.includes('not_found')
        ) {
          console.warn(`[AI System] Model "${modelName}" is unavailable (HTTP ${response.status}). Trying next candidate...`);
          lastError = `[${modelName}] 404 Not Found`;
          continue;
        }
        
        // For other errors (like 429), we might still want to try another model or bubble up
        lastError = `[${modelName}] HTTP ${response.status}: ${errorText}`;
        continue;
      }

      const data = await response.json();
      
      // If success, update local storage to remember this working model for future calls (Optional but requested)
      localStorage.setItem('exam_ai_gemini_model', modelName);
      
      return { data, usedModel: modelName };

    } catch (err: any) {
      console.error(`[AI System] Critical error with model "${modelName}":`, err);
      lastError = err.message || String(err);
      continue;
    }
  }

  throw new Error(`Tất cả mô hình AI đều không khả dụng. Lỗi cuối cùng: ${lastError}`);
}

/**
 * Utility to extract text candidates from Gemini response
 */
export function extractTextFromGeminiResponse(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const nonThoughtParts = parts.filter(
    (p: { text?: string; thought?: boolean }) => typeof p.text === 'string' && !p.thought
  );
  
  return nonThoughtParts.length > 0
    ? nonThoughtParts.map((p: { text: string }) => p.text).join('\n')
    : parts.map((p: { text?: string }) => p.text || '').join('\n');
}
