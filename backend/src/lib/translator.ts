/**
 * Transcript Translation Module
 *
 * Uses Groq LLM for language detection and translation to English.
 * Translates in chunks to handle long transcripts within token limits.
 */

import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const CHUNK_SIZE = 3000; // chars per translation chunk

export interface TranslationResult {
  translatedText: string;
  originalLanguage: string;
  wasTranslated: boolean;
}

/**
 * Detect the language of a text using LLM.
 * Returns an ISO 639-1 language code (e.g., "en", "ar", "fr").
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!groq) return 'en';

  const sample = text.substring(0, 500);

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a language detection system. Respond with ONLY the ISO 639-1 two-letter language code (e.g., "en", "ar", "fr", "es", "de", "ja", "ko", "hi", "tr"). No explanation.',
        },
        {
          role: 'user',
          content: `Detect the language of this text:\n\n${sample}`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const code = response.choices[0]?.message?.content?.trim().toLowerCase().replace(/[^a-z]/g, '');
    return code && code.length === 2 ? code : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Translate a text chunk to English using LLM.
 */
async function translateChunk(text: string): Promise<string> {
  if (!groq) return text;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a translator. Translate the following text to English. Return ONLY the translation, no explanation or commentary. Preserve paragraph breaks.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (err) {
    // Re-throw rate limit errors so callers can retry
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('rate_limit')) {
      throw err;
    }
    return text;
  }
}

/**
 * Translate a full text to English, chunking if necessary.
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!groq) return text;

  if (text.length <= CHUNK_SIZE) {
    return translateChunk(text);
  }

  // Split into chunks at sentence boundaries
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }

    // Find a sentence boundary near the chunk size
    let splitAt = remaining.lastIndexOf('. ', CHUNK_SIZE);
    if (splitAt < CHUNK_SIZE * 0.5) {
      splitAt = remaining.lastIndexOf(' ', CHUNK_SIZE);
    }
    if (splitAt < CHUNK_SIZE * 0.5) {
      splitAt = CHUNK_SIZE;
    }

    chunks.push(remaining.substring(0, splitAt + 1));
    remaining = remaining.substring(splitAt + 1).trimStart();
  }

  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk));
  }

  return translatedChunks.join(' ');
}

/**
 * Detect language and translate to English if needed.
 * Returns cached-friendly result with original language and translation status.
 */
export async function detectAndTranslate(text: string): Promise<TranslationResult> {
  if (!groq || !text || text.length < 20) {
    return { translatedText: text || '', originalLanguage: 'en', wasTranslated: false };
  }

  const language = await detectLanguage(text);

  if (language === 'en') {
    return { translatedText: text, originalLanguage: 'en', wasTranslated: false };
  }

  console.log(`[Translator] Detected language: ${language}, translating to English...`);
  const translatedText = await translateToEnglish(text);

  return { translatedText, originalLanguage: language, wasTranslated: true };
}
