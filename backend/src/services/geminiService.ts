import { getGeminiClient } from '../config/gemini.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface GenerateChatOptions {
  message: string;
  image?: string;
  imageMimeType?: string;
  history?: ChatHistoryMessage[];
  language?: {
    code: string;
    name: string;
    nativeName?: string;
  };
  country?: string;
  region?: string;
}

export async function generateAgricultureResponse(options: GenerateChatOptions): Promise<string> {
  const { message, image, imageMimeType, history = [], language, country, region } = options;

  const langCode = language?.code || 'en';
  const langName = language?.name || 'English';
  const langNative = language?.nativeName ? ` (${language.nativeName})` : '';

  let locationInfo = '';
  if (country || region) {
    locationInfo = `User's location context: Country: "${country || 'Not specified'}", Region/State: "${region || 'Not specified'}". Consider this geographical context (climate, regional soil, typical seasons) when advising, while clarifying general vs local practices.`;
  }

  const systemInstruction = `You are GreenGrow, a helpful global AI agriculture expert assistant.

CRITICAL TARGET LANGUAGE ENFORCEMENT:
- Active Response Language: ${langName}${langNative} [Language Code: ${langCode}].
- YOU MUST GENERATE 100% OF YOUR AGRICULTURAL RESPONSE IN ${langName} (${langNative}) USING ITS AUTHENTIC SCRIPT/ALPHABET (e.g. Cyrillic for Russian, Devanagari for Hindi, Kannada script for Kannada, Tamil script for Tamil, etc.).
- ZERO ENGLISH PERMITTED (unless the selected language is English).
- Even if the user types or speaks their question using English letters or English words (e.g. "how to grow corn", "soil preparation", "tomato diseases"), DO NOT REPLY IN ENGLISH. Translate the knowledge and formulate the entire advice in ${langName} (${langNative}).
- Even if prior messages in this conversation history were written in English or another language: the user has now selected ${langName}. You MUST answer strictly and entirely in ${langName}.
- NEVER start with English phrases like "Hello!", "Welcome back to GreenGrow", "Since you asked in English...", or "Here is the information...". Start directly with the agricultural response in ${langName}.

${locationInfo}

AGRICULTURE & CROP PHOTO DIAGNOSIS GUIDELINES:
- Provide clear, simple, practical step-by-step farming guidance.
- When an image of a plant, crop, leaf, fruit, weed, or insect pest is provided:
  1. Crop / Plant Identification: Identify what crop or plant is in the photo (e.g., Tomato, Paddy / Rice, Corn / Maize, Wheat, Cotton, Chili, Potato, Sugarcane, Banana, etc.).
  2. Health & Symptom Assessment: Accurately describe visible symptoms (e.g. yellowing chlorosis, brown leaf spots, powdery mildew, curled foliage, wilting, insect chew marks, stem rot).
  3. Diagnosis & Probable Cause: Name the exact disease, pest, or nutrient deficiency (e.g. Early / Late Blight, Leaf Curl Virus, Nitrogen / Potassium deficiency, Aphids, Fall Armyworm, Rust).
  4. Organic & Eco-Friendly Treatments: Prioritize natural, organic remedies that farmers can use easily (e.g. neem oil spray, wood ash, cow urine / manure formulations, trichoderma, bio-fungicides).
  5. Chemical / Conventional Remedies: Provide standard chemical treatment options with safe application directions (e.g. Mancozeb, Chlorpyrifos, Copper Oxychloride), warning the farmer to wear protective gloves/mask and verify with local agricultural extension officers.
  6. Prevention & Future Care: Give simple preventive measures to stop the issue from returning.
- Cover planting seasons, soil preparation, seed spacing, irrigation schedule, organic compost / fertilizers, and pest management.
- For serious crop diseases or chemical treatments, recommend consulting local agricultural extension officers.
- Politely decline non-agricultural topics in ${langName}.`;

  // Filter and limit history to the last 8 messages for token efficiency
  const sanitizedHistory = history
    .slice(-8)
    .filter((m) => m && m.content && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Determine effective prompt text (if photo is uploaded without text, use a structured diagnosis prompt)
  const effectiveMessage =
    message && message.trim().length > 0
      ? message.trim()
      : image
        ? 'Please inspect this plant/crop photo in detail. Identify the crop, diagnose any visible disease, insect pest, or nutrient deficiency, and provide step-by-step organic remedies and safe chemical treatment recommendations.'
        : 'Please provide agricultural guidance for this crop.';

  // Append user message with explicit language directive if non-English
  const userPromptText =
    langCode !== 'en'
      ? `[TARGET RESPONSE LANGUAGE: ${langName} (${langNative}) - ANSWER 100% IN ${langName} SCRIPT ONLY. DO NOT USE ENGLISH.]\n\nFarmer Query: ${effectiveMessage}`
      : effectiveMessage;

  // Build user parts (with multimodal image inlineData if attached)
  const userParts: any[] = [];
  if (image) {
    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
    const cleanMime = (imageMimeType || 'image/jpeg').split(';')[0].trim();
    userParts.push({
      inlineData: {
        mimeType: cleanMime,
        data: cleanBase64,
      },
    });
  }
  userParts.push({ text: userPromptText });

  const contents = [
    ...sanitizedHistory,
    {
      role: 'user',
      parts: userParts,
    },
  ];

  const ai = getGeminiClient();
  const configuredModel = config.gemini.model || 'gemini-2.0-flash';

  // Fast candidate model sequence
  const candidateModels = Array.from(
    new Set([
      configuredModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
    ])
  );

  let lastError: any = null;

  for (const targetModel of candidateModels) {
    try {
      logger.info(`Attempting request with Gemini model: ${targetModel} in ${langName} (${langCode})`);

      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      });

      const replyText = response.text || '';
      if (replyText.trim().length > 0) {
        logger.info(`Successfully generated answer with model: ${targetModel}`);
        return replyText;
      }
    } catch (error: any) {
      lastError = error;
      logger.warn(`Model ${targetModel} failed: ${error.message || error}. Falling back to next fast model...`);

      // If it is 404 (model deprecated) or 503 (temporary high demand spike), try next candidate model immediately!
      const canFallback =
        error.status === 503 ||
        error.status === 404 ||
        error.message?.includes('503') ||
        error.message?.includes('404') ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('high demand') ||
        error.message?.includes('no longer available') ||
        error.message?.includes('NOT_FOUND');

      if (canFallback) {
        continue;
      }

      // If auth failure or invalid parameter, break immediately
      break;
    }
  }

  // Handle final error if all attempts exhausted
  logger.error('Gemini API Error after attempts:', lastError.message || lastError);

  if (lastError.status === 429 || lastError.message?.includes('RESOURCE_EXHAUSTED') || lastError.message?.includes('rate limit')) {
    throw new Error('Gemini API rate limit reached. Please wait a moment before asking again.');
  } else if (lastError.status === 503 || lastError.message?.includes('UNAVAILABLE') || lastError.message?.includes('high demand')) {
    throw new Error('The Gemini AI service is currently experiencing a temporary demand spike. Please try again in a few seconds.');
  } else if (lastError.status === 400 || lastError.message?.includes('INVALID_ARGUMENT')) {
    throw new Error('Invalid request parameters sent to AI assistant.');
  } else if (lastError.status === 404 || lastError.message?.includes('not found') || lastError.message?.includes('NOT_FOUND')) {
    throw new Error(
      'Gemini API key is not enabled for Google AI Studio models. Please generate a free API key at https://aistudio.google.com/apikey and set it as GEMINI_API_KEY in Vercel.'
    );
  } else if (lastError.message?.includes('API key') || lastError.status === 401 || lastError.status === 403) {
    throw new Error('Gemini API authentication failed. Please verify your GEMINI_API_KEY in backend/.env.');
  }

  throw new Error(lastError.message || 'Unable to get response from GreenGrow AI. Please try again.');
}

export interface TranscribeAudioOptions {
  audioBase64: string;
  mimeType?: string;
  language?: {
    code: string;
    name: string;
    nativeName?: string;
  };
}

export async function transcribeAudioWithGemini(options: TranscribeAudioOptions): Promise<string> {
  const { audioBase64, mimeType = 'audio/webm', language } = options;
  const langName = language?.name || 'English';
  const langNative = language?.nativeName ? ` (${language.nativeName})` : '';
  const langCode = language?.code || 'en';

  // Strip codecs parameters like ';codecs=opus' which cause Gemini API 400 errors
  const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

  const ai = getGeminiClient();
  const primaryModel = config.gemini.model || 'gemini-3.5-flash-lite';
  const candidateModels = Array.from(
    new Set([primaryModel, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'])
  );

  for (const targetModel of candidateModels) {
    try {
      logger.info(`Transcribing audio with Gemini model: ${targetModel} in language: ${langName} (${langCode}) [mime: ${cleanMime}]`);
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioBase64,
                },
              },
              {
                text: `You are a professional verbatim speech-to-text transcriber for the GreenGrow application.
Target language: ${langName}${langNative} [code: ${langCode}].
Please transcribe the spoken audio into text.

CRITICAL INSTRUCTIONS:
1. Transcribe ONLY the exact words actually spoken by the human speaker in the audio clip.
2. NEVER invent, hallucinate, guess, or make up questions or sentences (e.g. NEVER make up "Where can I find the fertilizer recommendations" or any other question).
3. If the audio is silent, contains only background static/noise, or if no intelligible words were spoken, you MUST respond with EXACTLY: NO_SPEECH
4. Output ONLY the raw transcribed words in ${langName} using its proper script. Do NOT add any preamble, conversational answer, notes, or quotation marks.`,
              },
            ],
          },
        ],
      });

      let text = (response.text || '').trim();
      if (text.includes('NO_SPEECH') || text === '""' || text === "''") {
        return '';
      }
      return text;
    } catch (err: any) {
      logger.warn(`Model ${targetModel} transcription failed: ${err.message}. Trying next candidate...`);
    }
  }

  throw new Error('Unable to transcribe audio with Gemini AI.');
}
