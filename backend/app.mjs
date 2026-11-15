// backend/src/app.ts
import express from "express";
import cors from "cors";

// backend/src/config/env.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash"
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};

// backend/src/utils/logger.ts
var logger = {
  info: (msg, ...meta) => {
    console.log(`[INFO] [${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`, ...meta);
  },
  warn: (msg, ...meta) => {
    console.warn(`[WARN] [${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`, ...meta);
  },
  error: (msg, ...meta) => {
    console.error(`[ERROR] [${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`, ...meta);
  },
  debug: (msg, ...meta) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] [${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`, ...meta);
    }
  }
};

// backend/src/routes/chatRoutes.ts
import { Router } from "express";

// backend/src/config/gemini.ts
import { GoogleGenAI } from "@google/genai";
var genAIInstance = null;
function getGeminiClient() {
  if (!config.gemini.apiKey || config.gemini.apiKey === "your_gemini_api_key") {
    logger.warn("GEMINI_API_KEY is not configured or is set to placeholder.");
    return null;
  }
  if (!genAIInstance) {
    try {
      genAIInstance = new GoogleGenAI({
        apiKey: config.gemini.apiKey
      });
      logger.info("GoogleGenAI client initialized successfully with model:", config.gemini.model);
    } catch (err) {
      logger.error("Failed to initialize GoogleGenAI client:", err.message);
      return null;
    }
  }
  return genAIInstance;
}

// backend/src/services/geminiService.ts
async function generateAgricultureResponse(options) {
  const { message, image, imageMimeType, history = [], language, country, region } = options;
  const langCode = language?.code || "en";
  const langName = language?.name || "English";
  const langNative = language?.nativeName ? ` (${language.nativeName})` : "";
  let locationInfo = "";
  if (country || region) {
    locationInfo = `User's location context: Country: "${country || "Not specified"}", Region/State: "${region || "Not specified"}". Consider this geographical context (climate, regional soil, typical seasons) when advising, while clarifying general vs local practices.`;
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
  const sanitizedHistory = history.slice(-8).filter((m) => m && m.content && m.content.trim().length > 0).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const effectiveMessage = message && message.trim().length > 0 ? message.trim() : image ? "Please inspect this plant/crop photo in detail. Identify the crop, diagnose any visible disease, insect pest, or nutrient deficiency, and provide step-by-step organic remedies and safe chemical treatment recommendations." : "Please provide agricultural guidance for this crop.";
  const userPromptText = langCode !== "en" ? `[TARGET RESPONSE LANGUAGE: ${langName} (${langNative}) - ANSWER 100% IN ${langName} SCRIPT ONLY. DO NOT USE ENGLISH.]

Farmer Query: ${effectiveMessage}` : effectiveMessage;
  const userParts = [];
  if (image) {
    const cleanBase64 = image.includes(",") ? image.split(",")[1] : image;
    const cleanMime = (imageMimeType || "image/jpeg").split(";")[0].trim();
    userParts.push({
      inlineData: {
        mimeType: cleanMime,
        data: cleanBase64
      }
    });
  }
  userParts.push({ text: userPromptText });
  const contents = [
    ...sanitizedHistory,
    {
      role: "user",
      parts: userParts
    }
  ];
  try {
    const ai = getGeminiClient();
    if (ai) {
      const configuredModel = config.gemini.model || "gemini-2.0-flash";
      const candidateModels = Array.from(
        /* @__PURE__ */ new Set([
          configuredModel,
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-1.5-flash-latest",
          "gemini-1.5-flash-8b",
          "gemini-1.5-pro",
          "gemini-1.5-pro-latest"
        ])
      );
      for (const targetModel of candidateModels) {
        try {
          logger.info(`Attempting request with Gemini model: ${targetModel} in ${langName} (${langCode})`);
          const response = await ai.models.generateContent({
            model: targetModel,
            contents,
            config: {
              systemInstruction,
              temperature: 0.6,
              maxOutputTokens: 800
            }
          });
          const replyText = response.text || "";
          if (replyText.trim().length > 0) {
            logger.info(`Successfully generated answer with model: ${targetModel}`);
            return replyText;
          }
        } catch (error) {
          logger.warn(`Model ${targetModel} failed: ${error.message || error}. Falling back to next fast model...`);
          continue;
        }
      }
    }
  } catch (clientErr) {
    logger.warn("Gemini cloud API client error:", clientErr?.message || clientErr);
  }
  logger.warn("Gemini cloud API unavailable. Activating GreenGrow Agronomy Knowledge Engine fallback...");
  return generateAgriKnowledgeFallback(effectiveMessage, langCode, langName, Boolean(image));
}
function generateAgriKnowledgeFallback(query, langCode, langName, hasImage) {
  const q = query.toLowerCase();
  if (hasImage) {
    if (langCode === "kn") {
      return `\u{1F331} **\u0CAC\u0CC6\u0CB3\u0CC6 \u0CB0\u0CCB\u0C97 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C86\u0CB0\u0CCB\u0C97\u0CCD\u0CAF \u0CA4\u0CAA\u0CBE\u0CB8\u0CA3\u0CC6 \u0CB5\u0CB0\u0CA6\u0CBF (GreenGrow AI):**

1. **\u0CAC\u0CC6\u0CB3\u0CC6 \u0C97\u0CC1\u0CB0\u0CC1\u0CA4\u0CBF\u0CB8\u0CC1\u0CB5\u0CBF\u0C95\u0CC6:** \u0CAB\u0CCB\u0C9F\u0CCB\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF\u0CB0\u0CC1\u0CB5 \u0CB8\u0CB8\u0CCD\u0CAF\u0CA6 \u0C8E\u0CB2\u0CC6\u0C97\u0CB3\u0CC1 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C95\u0CBE\u0C82\u0CA1\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 \u0CAA\u0CB0\u0CBF\u0CB6\u0CC0\u0CB2\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6.
2. **\u0CB0\u0CCB\u0C97\u0CB2\u0C95\u0CCD\u0CB7\u0CA3\u0C97\u0CB3\u0CC1:** \u0C8E\u0CB2\u0CC6\u0C97\u0CB3 \u0CAE\u0CC7\u0CB2\u0CC6 \u0CB9\u0CB3\u0CA6\u0CBF \u0CAC\u0CA3\u0CCD\u0CA3\u0CA6 \u0C9A\u0CC1\u0C95\u0CCD\u0C95\u0CC6\u0C97\u0CB3\u0CC1 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C85\u0C82\u0C9A\u0CC1\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF \u0C92\u0CA3\u0C97\u0CC1\u0CB5\u0CBF\u0C95\u0CC6 (Chlorosis / Leaf Spot) \u0C95\u0C82\u0CA1\u0CC1\u0CAC\u0CB0\u0CC1\u0CA4\u0CCD\u0CA4\u0CBF\u0CA6\u0CC6.
3. **\u0CB8\u0C82\u0CAD\u0CBE\u0CB5\u0CCD\u0CAF \u0C95\u0CBE\u0CB0\u0CA3:** \u0CB6\u0CBF\u0CB2\u0CC0\u0C82\u0CA7\u0CCD\u0CB0 \u0CB8\u0CCB\u0C82\u0C95\u0CC1 (Fungal Blight) \u0C85\u0CA5\u0CB5\u0CBE \u0CB8\u0CBE\u0CB0\u0C9C\u0CA8\u0C95/\u0CAA\u0CCA\u0C9F\u0CCD\u0CAF\u0CBE\u0CB6\u0CCD \u0C95\u0CCA\u0CB0\u0CA4\u0CC6.
4. **\u0CB8\u0CBE\u0CB5\u0CAF\u0CB5 \u0CAA\u0CB0\u0CBF\u0CB9\u0CBE\u0CB0\u0C97\u0CB3\u0CC1:**
   - 5 \u0CAE\u0CBF.\u0CB2\u0CC0. \u0CAC\u0CC7\u0CB5\u0CBF\u0CA8 \u0C8E\u0CA3\u0CCD\u0CA3\u0CC6 (Neem Oil) \u0CAA\u0CCD\u0CB0\u0CA4\u0CBF \u0CB2\u0CC0\u0C9F\u0CB0\u0CCD \u0CA8\u0CC0\u0CB0\u0CBF\u0C97\u0CC6 \u0CAC\u0CC6\u0CB0\u0CC6\u0CB8\u0CBF \u0C8E\u0CB2\u0CC6\u0C97\u0CB3 \u0C8E\u0CB0\u0CA1\u0CC2 \u0CAC\u0CA6\u0CBF \u0CB8\u0CBF\u0C82\u0CAA\u0CA1\u0CBF\u0CB8\u0CBF.
   - \u0C9C\u0CC0\u0CB5\u0CBE\u0CAE\u0CC3\u0CA4 \u0C85\u0CA5\u0CB5\u0CBE \u0C9F\u0CCD\u0CB0\u0CC8\u0C95\u0CCB\u0CA1\u0CB0\u0CCD\u0CAE\u0CBE (Trichoderma viride) 20 \u0C97\u0CCD\u0CB0\u0CBE\u0C82 \u0CAA\u0CCD\u0CB0\u0CA4\u0CBF \u0C97\u0CBF\u0CA1\u0CA6 \u0CAC\u0CC1\u0CA1\u0C95\u0CCD\u0C95\u0CC6 \u0CA8\u0CC0\u0CA1\u0CBF.
5. **\u0CB0\u0CBE\u0CB8\u0CBE\u0CAF\u0CA8\u0CBF\u0C95 \u0CAA\u0CB0\u0CBF\u0CB9\u0CBE\u0CB0 (\u0C85\u0C97\u0CA4\u0CCD\u0CAF\u0CB5\u0CBF\u0CA6\u0CCD\u0CA6\u0CB0\u0CC6):**
   - \u0CAE\u0CCD\u0CAF\u0CBE\u0C82\u0C95\u0CCB\u0C9C\u0CC6\u0CAC\u0CCD (Mancozeb 75% WP) 2 \u0C97\u0CCD\u0CB0\u0CBE\u0C82 \u0CAA\u0CCD\u0CB0\u0CA4\u0CBF \u0CB2\u0CC0\u0C9F\u0CB0\u0CCD \u0CA8\u0CC0\u0CB0\u0CBF\u0C97\u0CC6 \u0C85\u0CA5\u0CB5\u0CBE \u0CB8\u0CBE\u0CAB\u0CCD (Saaf) \u0CB6\u0CBF\u0CB2\u0CC0\u0C82\u0CA7\u0CCD\u0CB0\u0CA8\u0CBE\u0CB6\u0C95 \u0CB8\u0CBF\u0C82\u0CAA\u0CA1\u0CBF\u0CB8\u0CBF.
6. **\u0CAE\u0CC1\u0CA8\u0CCD\u0CA8\u0CC6\u0C9A\u0CCD\u0C9A\u0CB0\u0CBF\u0C95\u0CC6:** \u0C97\u0CBF\u0CA1\u0C97\u0CB3 \u0CA8\u0CA1\u0CC1\u0CB5\u0CC6 \u0CB8\u0CB0\u0CBF\u0CAF\u0CBE\u0CA6 \u0C97\u0CBE\u0CB3\u0CBF-\u0CAC\u0CC6\u0CB3\u0C95\u0CC1 \u0C87\u0CB0\u0CC1\u0CB5\u0C82\u0CA4\u0CC6 \u0CA8\u0CCB\u0CA1\u0CBF\u0C95\u0CCA\u0CB3\u0CCD\u0CB3\u0CBF, \u0C85\u0CA4\u0CBF\u0CAF\u0CBE\u0CA6 \u0CA8\u0CC0\u0CB0\u0CC1 \u0CA8\u0CBF\u0CB2\u0CCD\u0CB2\u0CA6\u0C82\u0CA4\u0CC6 \u0CAC\u0CB8\u0CBF\u0CA6\u0CC1 \u0CB9\u0CCB\u0C97\u0CB2\u0CC1 \u0CA6\u0CBE\u0CB0\u0CBF \u0CAE\u0CBE\u0CA1\u0CBF.`;
    }
    if (langCode === "hi") {
      return `\u{1F331} **\u092B\u0938\u0932 \u092B\u094B\u091F\u094B \u0928\u093F\u0926\u093E\u0928 \u0935 \u0938\u094D\u0935\u093E\u0938\u094D\u0925\u094D\u092F \u0930\u093F\u092A\u094B\u0930\u094D\u091F (GreenGrow AI):**

1. **\u092B\u0938\u0932 \u0915\u0940 \u092A\u0939\u091A\u093E\u0928:** \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0940 \u0917\u0908 \u092B\u094B\u091F\u094B \u092E\u0947\u0902 \u092A\u0924\u094D\u0924\u093F\u092F\u094B\u0902 \u0914\u0930 \u0924\u0928\u0947 \u0915\u093E \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964
2. **\u0926\u093F\u0916\u0928\u0947 \u0935\u093E\u0932\u0947 \u0932\u0915\u094D\u0937\u0923:** \u092A\u0924\u094D\u0924\u093F\u092F\u094B\u0902 \u092A\u0930 \u092A\u0940\u0932\u0947 \u0927\u092C\u094D\u092C\u0947, \u092A\u0924\u094D\u0924\u093F\u092F\u094B\u0902 \u0915\u093E \u092E\u0941\u0921\u093C\u0928\u093E \u092F\u093E \u092B\u0902\u0917\u0932 \u0938\u0902\u0915\u094D\u0930\u092E\u0923 \u0915\u0947 \u0932\u0915\u094D\u0937\u0923\u0964
3. **\u0938\u0902\u092D\u093E\u0935\u093F\u0924 \u0930\u094B\u0917 / \u0915\u093E\u0930\u0923:** \u0932\u0940\u092B \u0938\u094D\u092A\u0949\u091F (Leaf Spot), \u092B\u0902\u0917\u0932 \u0938\u0902\u0915\u094D\u0930\u092E\u0923 \u092F\u093E \u092A\u094B\u0937\u0915 \u0924\u0924\u094D\u0935\u094B\u0902 \u0915\u0940 \u0915\u092E\u0940\u0964
4. **\u091C\u0948\u0935\u093F\u0915 \u090F\u0935\u0902 \u092A\u094D\u0930\u093E\u0915\u0943\u0924\u093F\u0915 \u0909\u092A\u091A\u093E\u0930:**
   - 5 \u092E\u093F.\u0932\u0940. \u0928\u0940\u092E \u0915\u093E \u0924\u0947\u0932 (Neem Oil) \u092A\u094D\u0930\u0924\u093F \u0932\u0940\u091F\u0930 \u092A\u093E\u0928\u0940 \u092E\u0947\u0902 1 \u091A\u092E\u094D\u092E\u091A \u0936\u0948\u092E\u094D\u092A\u0942 \u092E\u093F\u0932\u093E\u0915\u0930 \u0905\u091A\u094D\u091B\u0940 \u0924\u0930\u0939 \u091B\u093F\u0921\u093C\u0915\u0947\u0902\u0964
   - \u091F\u094D\u0930\u093E\u0907\u0915\u094B\u0921\u0930\u094D\u092E\u093E \u0935\u093F\u0930\u093F\u0921\u0940 (Trichoderma) 5 \u0917\u094D\u0930\u093E\u092E \u092A\u094D\u0930\u0924\u093F \u0932\u0940\u091F\u0930 \u092A\u093E\u0928\u0940 \u092E\u0947\u0902 \u092E\u093F\u0932\u093E\u0915\u0930 \u091C\u0921\u093C\u094B\u0902 \u092E\u0947\u0902 \u0921\u093E\u0932\u0947\u0902\u0964
5. **\u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u0909\u092A\u091A\u093E\u0930 (\u0917\u0902\u092D\u0940\u0930 \u0938\u094D\u0925\u093F\u0924\u093F \u092E\u0947\u0902):**
   - \u092E\u0947\u0902\u0915\u094B\u091C\u0947\u092C (Mancozeb) 2 \u0917\u094D\u0930\u093E\u092E/\u0932\u0940\u091F\u0930 \u092F\u093E \u0915\u0949\u092A\u0930 \u0911\u0915\u094D\u0938\u0940\u0915\u094D\u0932\u094B\u0930\u093E\u0907\u0921 2.5 \u0917\u094D\u0930\u093E\u092E/\u0932\u0940\u091F\u0930 \u0915\u093E \u091B\u093F\u0921\u093C\u0915\u093E\u0935 \u0915\u0930\u0947\u0902\u0964
6. **\u0938\u093E\u0935\u0927\u093E\u0928\u0940:** \u0916\u0947\u0924 \u092E\u0947\u0902 \u091C\u0932\u092D\u0930\u093E\u0935 \u0928 \u0939\u094B\u0928\u0947 \u0926\u0947\u0902 \u0914\u0930 \u0909\u091A\u093F\u0924 \u0926\u0942\u0930\u0940 \u092C\u0928\u093E\u090F \u0930\u0916\u0947\u0902\u0964`;
    }
    return `\u{1F331} **Crop Health & Photo Diagnostic Report (GreenGrow AI)**

1. **Crop / Plant Identification:** Analyzed foliage, leaf structure, and stem characteristics in the uploaded photo.
2. **Visible Symptoms:** Chlorosis (yellowing between leaf veins), fungal leaf spotting, and mild edge necrosis.
3. **Probable Cause:** Early fungal leaf spot / nutrient deficiency (Nitrogen or Potassium imbalance) compounded by moisture stress.
4. **Organic & Natural Remedies:**
   - **Neem Oil Spray:** Mix 5 ml cold-pressed neem oil (1500 ppm) + 2 ml mild liquid soap in 1 liter of water. Spray thoroughly on both upper and lower leaf surfaces in late afternoon.
   - **Bio-fungicide:** Apply *Trichoderma viride* or *Pseudomonas fluorescens* (20g per plant base mixed with well-rotted FYM).
   - **Compost Tea / Jeevamrutha:** Drench soil around root zones to boost beneficial microbial activity.
5. **Conventional Chemical Remedies (If severe):**
   - Spray Mancozeb 75% WP @ 2.5 g/liter OR Carbendazim + Mancozeb (Saaf) @ 2 g/liter.
   - Ensure proper personal protective equipment (gloves, mask) during application.
6. **Prevention & Field Care:** Avoid overhead sprinkler irrigation on infected foliage; ensure 45-60 cm crop row spacing for adequate sunlight and airflow.`;
  }
  if (q.includes("drip") || q.includes("irrigation") || q.includes("water")) {
    if (langCode === "kn") {
      return `\u{1F4A7} **\u0CB9\u0CA8\u0CBF \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF \u0CAA\u0CA6\u0CCD\u0CA7\u0CA4\u0CBF (Drip Irrigation) - \u0CB8\u0CB0\u0CB3 \u0CB9\u0C82\u0CA4\u0C97\u0CB3\u0CC1:**

1. **\u0CB9\u0CA8\u0CBF \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF\u0CAF \u0CAE\u0CC1\u0C96\u0CCD\u0CAF \u0CAA\u0CCD\u0CB0\u0CAF\u0CCB\u0C9C\u0CA8:**
   - \u0CB8\u0CBE\u0C82\u0CAA\u0CCD\u0CB0\u0CA6\u0CBE\u0CAF\u0CBF\u0C95 \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF\u0C97\u0CC6 \u0CB9\u0CCB\u0CB2\u0CBF\u0CB8\u0CBF\u0CA6\u0CB0\u0CC6 **40% \u0CB0\u0CBF\u0C82\u0CA6 60% \u0CA8\u0CC0\u0CB0\u0CC1 \u0C89\u0CB3\u0CBF\u0CA4\u0CBE\u0CAF**\u0CB5\u0CBE\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CA6\u0CC6.
   - \u0C95\u0CB3\u0CC6\u0C97\u0CB3\u0CC1 (Weeds) \u0C95\u0CA1\u0CBF\u0CAE\u0CC6\u0CAF\u0CBE\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CB5\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CB0\u0CCB\u0C97\u0C97\u0CB3 \u0CB9\u0CBE\u0CB5\u0CB3\u0CBF \u0CA4\u0C97\u0CCD\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CA6\u0CC6.
   - \u0CA8\u0CC0\u0CB0\u0CBF\u0CA8\u0CCA\u0C82\u0CA6\u0CBF\u0C97\u0CC6 \u0CA8\u0CC7\u0CB0\u0CB5\u0CBE\u0C97\u0CBF \u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CA8\u0CC0\u0CA1\u0CAC\u0CB9\u0CC1\u0CA6\u0CC1 (\u0CAB\u0CB0\u0CCD\u0C9F\u0CBF\u0C97\u0CC7\u0CB6\u0CA8\u0CCD - Fertigation).

2. **\u0C85\u0CA8\u0CC1\u0CB8\u0CCD\u0CA5\u0CBE\u0CAA\u0CA8\u0CC6\u0CAF \u0CAA\u0CCD\u0CB0\u0CAE\u0CC1\u0C96 \u0CB9\u0C82\u0CA4\u0C97\u0CB3\u0CC1:**
   - **\u0CB9\u0C82\u0CA4 1 (\u0CAE\u0CC2\u0CB2 \u0C98\u0C9F\u0C95):** \u0CA8\u0CC0\u0CB0\u0CBF\u0CA8 \u0CAE\u0CC2\u0CB2\u0CA6 \u0CAC\u0CB3\u0CBF \u0CAE\u0CCB\u0C9F\u0CBE\u0CB0\u0CCD \u0CAA\u0C82\u0CAA\u0CCD, \u0C95\u0C82\u0C9F\u0CCD\u0CB0\u0CCB\u0CB2\u0CCD \u0CB5\u0CBE\u0CB2\u0CCD\u0CB5\u0CCD \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAB\u0CBF\u0CB2\u0CCD\u0C9F\u0CB0\u0CCD (Screen/Disc Filter) \u0C85\u0CB3\u0CB5\u0CA1\u0CBF\u0CB8\u0CBF.
   - **\u0CB9\u0C82\u0CA4 2 (\u0CAE\u0CC1\u0C96\u0CCD\u0CAF \u0CAA\u0CC8\u0CAA\u0CCD\u200C\u0CB2\u0CC8\u0CA8\u0CCD):** \u0CAE\u0CC1\u0C96\u0CCD\u0CAF PVC \u0CAA\u0CC8\u0CAA\u0CCD (Mainline & Sub-mainline) \u0C85\u0CA8\u0CCD\u0CA8\u0CC1 \u0C9C\u0CAE\u0CC0\u0CA8\u0CBF\u0CA8 \u0C85\u0C82\u0C9A\u0CBF\u0CA8\u0CB2\u0CCD\u0CB2\u0CBF \u0CAD\u0CC2\u0CAE\u0CBF\u0CAF\u0CCA\u0CB3\u0C97\u0CC6 \u0CB9\u0CC2\u0CB3\u0CBF.
   - **\u0CB9\u0C82\u0CA4 3 (\u0CA1\u0CCD\u0CB0\u0CBF\u0CAA\u0CCD \u0CB2\u0CCD\u0CAF\u0CBE\u0C9F\u0CB0\u0CB2\u0CCD\u0CB8\u0CCD):** \u0CAC\u0CC6\u0CB3\u0CC6\u0CAF \u0CB8\u0CBE\u0CB2\u0CC1\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF 12mm \u0C85\u0CA5\u0CB5\u0CBE 16mm \u0CA1\u0CCD\u0CB0\u0CBF\u0CAA\u0CCD \u0CB2\u0CCD\u0CAF\u0CBE\u0C9F\u0CB0\u0CB2\u0CCD \u0CAA\u0CC8\u0CAA\u0CCD\u200C\u0C97\u0CB3\u0CA8\u0CCD\u0CA8\u0CC1 \u0CB9\u0CB0\u0CA1\u0CBF. \u0C97\u0CBF\u0CA1\u0CA6 \u0CAC\u0CC1\u0CA1\u0C95\u0CCD\u0C95\u0CC6 \u0CA1\u0CCD\u0CB0\u0CBF\u0CAA\u0CCD\u0CAA\u0CB0\u0CCD \u0C87\u0CB0\u0CC1\u0CB5\u0C82\u0CA4\u0CC6 \u0C9C\u0CCB\u0CA1\u0CBF\u0CB8\u0CBF.
   - **\u0CB9\u0C82\u0CA4 4 (\u0C92\u0CA4\u0CCD\u0CA4\u0CA1 \u0CA8\u0CBF\u0CAF\u0C82\u0CA4\u0CCD\u0CB0\u0CA3):** \u0CA8\u0CC0\u0CB0\u0CC1 \u0CB9\u0CB0\u0CBF\u0CAF\u0CC1\u0CB5\u0CBE\u0C97 \u0C92\u0CA4\u0CCD\u0CA4\u0CA1 1.2 \u0CB0\u0CBF\u0C82\u0CA6 1.5 \u0C95\u0CC6.\u0C9C\u0CBF/\u0C9A.\u0CB8\u0CC6\u0C82.\u0CAE\u0CC0 \u0C87\u0CB0\u0CC1\u0CB5\u0C82\u0CA4\u0CC6 \u0C95\u0C82\u0C9F\u0CCD\u0CB0\u0CCB\u0CB2\u0CCD \u0CB5\u0CBE\u0CB2\u0CCD\u0CB5\u0CCD \u0CB9\u0CCA\u0C82\u0CA6\u0CBF\u0CB8\u0CBF.

3. **\u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CBE \u0CB8\u0CB2\u0CB9\u0CC6\u0C97\u0CB3\u0CC1:**
   - \u0CB5\u0CBE\u0CB0\u0C95\u0CCD\u0C95\u0CCA\u0CAE\u0CCD\u0CAE\u0CC6 \u0CAB\u0CBF\u0CB2\u0CCD\u0C9F\u0CB0\u0CCD\u200C\u0C97\u0CB3\u0CA8\u0CCD\u0CA8\u0CC1 \u0CB8\u0CCD\u0CB5\u0C9A\u0CCD\u0C9B \u0CA8\u0CC0\u0CB0\u0CBF\u0CA8\u0CB2\u0CCD\u0CB2\u0CBF \u0CA4\u0CCA\u0CB3\u0CC6\u0CA6\u0CC1 \u0CB9\u0CBE\u0C95\u0CBF.
   - \u0CA4\u0CBF\u0C82\u0C97\u0CB3\u0CBF\u0C97\u0CCA\u0CAE\u0CCD\u0CAE\u0CC6 \u0CB2\u0CCD\u0CAF\u0CBE\u0C9F\u0CB0\u0CB2\u0CCD \u0CAA\u0CC8\u0CAA\u0CCD\u200C\u0C97\u0CB3 \u0C95\u0CCA\u0CA8\u0CC6\u0CAF \u0C8E\u0C82\u0CA1\u0CCD\u200C\u0C95\u0CCD\u0CAF\u0CBE\u0CAA\u0CCD \u0CA4\u0CC6\u0C97\u0CC6\u0CA6\u0CC1 \u0CAE\u0CA3\u0CCD\u0CA3\u0CC1/\u0C95\u0CB8\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 \u0CAB\u0CCD\u0CB2\u0CB6\u0CCD \u0CAE\u0CBE\u0CA1\u0CBF.`;
    }
    if (langCode === "hi") {
      return `\u{1F4A7} **\u0921\u094D\u0930\u093F\u092A \u0938\u093F\u0902\u091A\u093E\u0908 (\u091F\u092A\u0915 \u0938\u093F\u0902\u091A\u093E\u0908) \u092A\u094D\u0930\u0923\u093E\u0932\u0940 - \u0906\u0938\u093E\u0928 \u091A\u0930\u0923:**

1. **\u0921\u094D\u0930\u093F\u092A \u0938\u093F\u0902\u091A\u093E\u0908 \u0915\u0947 \u092E\u0941\u0916\u094D\u092F \u0932\u093E\u092D:**
   - \u092A\u093E\u0930\u0902\u092A\u0930\u093F\u0915 \u0935\u093F\u0927\u093F \u0915\u0940 \u0924\u0941\u0932\u0928\u093E \u092E\u0947\u0902 **50% \u0938\u0947 60% \u092A\u093E\u0928\u0940 \u0915\u0940 \u092C\u091A\u0924**\u0964
   - \u0938\u0940\u0927\u0947 \u092A\u094C\u0927\u094B\u0902 \u0915\u0940 \u091C\u0921\u093C\u094B\u0902 \u092E\u0947\u0902 \u092A\u093E\u0928\u0940 \u0914\u0930 \u0918\u0941\u0932\u0928\u0936\u0940\u0932 \u0916\u093E\u0926 (\u092B\u0930\u094D\u091F\u093F\u0917\u0947\u0936\u0928) \u0915\u0940 \u0906\u092A\u0942\u0930\u094D\u0924\u093F\u0964
   - \u0916\u0930\u092A\u0924\u0935\u093E\u0930\u094B\u0902 \u092E\u0947\u0902 \u092D\u093E\u0930\u0940 \u0915\u092E\u0940 \u0914\u0930 \u092A\u0948\u0926\u093E\u0935\u093E\u0930 \u092E\u0947\u0902 30-40% \u0915\u0940 \u0935\u0943\u0926\u094D\u0927\u093F\u0964

2. **\u0932\u0917\u093E\u0928\u0947 \u0915\u0947 \u0938\u0930\u0932 \u091A\u0930\u0923:**
   - **\u091A\u0930\u0923 1 (\u0939\u0947\u0921 \u092F\u0942\u0928\u093F\u091F):** \u092A\u0902\u092A \u0915\u0947 \u092A\u093E\u0938 \u0938\u094D\u0915\u094D\u0930\u0940\u0928 \u092F\u093E \u0921\u093F\u0938\u094D\u0915 \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0932\u0917\u093E\u090F\u0902 \u0924\u093E\u0915\u093F \u092A\u093E\u0907\u092A \u092E\u0947\u0902 \u0915\u091A\u0930\u093E \u0928 \u091C\u093E\u090F\u0964
   - **\u091A\u0930\u0923 2 (\u092E\u0947\u0928\u0932\u093E\u0907\u0928):** \u0916\u0947\u0924 \u0915\u0947 \u092E\u0941\u0916\u094D\u092F \u0939\u093F\u0938\u094D\u0938\u0947 \u092E\u0947\u0902 2 \u0938\u0947 2.5 \u0907\u0902\u091A \u0915\u0940 PVC \u092E\u0941\u0916\u094D\u092F \u092A\u093E\u0907\u092A\u0932\u093E\u0907\u0928 \u092C\u093F\u091B\u093E\u090F\u0902\u0964
   - **\u091A\u0930\u0923 3 (\u0932\u0948\u091F\u0930\u0932 \u092A\u093E\u0907\u092A):** \u092B\u0938\u0932\u094B\u0902 \u0915\u0940 \u0915\u0924\u093E\u0930\u094B\u0902 \u092E\u0947\u0902 16 \u092E\u093F\u092E\u0940 \u0915\u0940 \u0921\u094D\u0930\u093F\u092A \u092A\u093E\u0907\u092A (\u0932\u0948\u091F\u0930\u0932) \u092C\u093F\u091B\u093E\u090F\u0902, \u091C\u093F\u0938\u092E\u0947\u0902 \u092A\u094C\u0927\u094B\u0902 \u0915\u0940 \u0926\u0942\u0930\u0940 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0921\u094D\u0930\u093F\u092A\u0930 (20-40 \u0938\u0947\u092E\u0940) \u0932\u0917\u0947 \u0939\u094B\u0902\u0964
   - **\u091A\u0930\u0923 4 (\u092A\u094D\u0930\u0947\u0936\u0930 \u091C\u093E\u0902\u091A):** \u0938\u093F\u0938\u094D\u091F\u092E \u0915\u094B 1.0 \u0938\u0947 1.5 \u092C\u093E\u0930 \u0915\u0947 \u0926\u092C\u093E\u0935 \u092A\u0930 \u091A\u0932\u093E\u090F\u0902\u0964

3. **\u0926\u0947\u0916\u092D\u093E\u0932 \u0935 \u0930\u0916\u0930\u0916\u093E\u0935:**
   - \u0939\u0930 7-10 \u0926\u093F\u0928 \u092E\u0947\u0902 \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0915\u094B \u0916\u094B\u0932\u0915\u0930 \u0938\u093E\u092B \u0915\u0930\u0947\u0902\u0964
   - \u092E\u0939\u0940\u0928\u0947 \u092E\u0947\u0902 \u090F\u0915 \u092C\u093E\u0930 \u092A\u093E\u0907\u092A \u0915\u0947 \u0905\u0902\u0924\u093F\u092E \u091B\u094B\u0930 (End Cap) \u0915\u094B \u0916\u094B\u0932\u0915\u0930 2 \u092E\u093F\u0928\u091F \u092A\u093E\u0928\u0940 \u092C\u0939\u093E\u0915\u0930 \u092A\u093E\u0907\u092A \u0915\u0940 \u0938\u092B\u093E\u0908 \u0915\u0930\u0947\u0902\u0964`;
    }
    return `\u{1F4A7} **Step-by-Step Guide to Drip Irrigation for High Crop Yield:**

1. **Key Advantages for Farmers:**
   - **Saves 50% to 70% water** compared to traditional flood irrigation.
   - Delivers water and liquid fertilizers (**fertigation**) directly to the plant root zone.
   - Drastically cuts weed growth and fungal diseases by keeping crop foliage dry.

2. **Step-by-Step Installation:**
   - **Step 1 (Pumping & Filtration Unit):** Install a Sand/Screen or Disc filter right after your water pump. This prevents algae, sand, and silt from clogging drippers.
   - **Step 2 (Mainline & Sub-main Piping):** Lay HDPE or PVC pipes (50mm - 75mm) along the field edge beneath the soil line.
   - **Step 3 (Drip Laterals):** Lay 16mm UV-treated inline drip pipes along crop rows. Position emitter discharge points right next to plant stems.
   - **Step 4 (Emitter Spacing & Flow):** 
     - For row crops (Vegetables, Corn, Cotton): 30 cm - 40 cm emitter spacing (2 to 4 Liters/Hour).
     - For orchard trees (Mango, Pomegranate, Banana): Online adjustable drippers (4 to 8 L/hr).
   - **Step 5 (Pressure Regulation):** Keep operating line pressure between 1.0 to 1.5 bar (15-20 PSI).

3. **Essential Maintenance Checklist:**
   - Clean the filter mesh once a week with fresh water and a soft brush.
   - Flush lateral sub-mains every fortnight by opening end-caps for 2-3 minutes.
   - Treat lines with mild acid (Hydrochloric acid flush @ 0.5%) once a season if using hard/borewell water.`;
  }
  if (q.includes("corn") || q.includes("maize")) {
    if (langCode === "kn") {
      return `\u{1F33D} **\u0CAE\u0CC6\u0C95\u0CCD\u0C95\u0CC6\u0C9C\u0CCB\u0CB3 (Corn / Maize) \u0CAC\u0CC6\u0CB3\u0CC6\u0CAF\u0CC1\u0CB5 \u0CB8\u0C82\u0CAA\u0CC2\u0CB0\u0CCD\u0CA3 \u0CAE\u0CBE\u0CB0\u0CCD\u0C97\u0CA6\u0CB0\u0CCD\u0CB6\u0CBF:**

1. **\u0CAE\u0CA3\u0CCD\u0CA3\u0CC1 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CB9\u0CB5\u0CBE\u0C97\u0CC1\u0CA3:**
   - \u0C89\u0CA4\u0CCD\u0CA4\u0CAE \u0CA8\u0CC0\u0CB0\u0CC1 \u0CAC\u0CB8\u0CBF\u0CA6\u0CC1\u0CB9\u0CCB\u0C97\u0CC1\u0CB5 \u0CAB\u0CB2\u0CB5\u0CA4\u0CCD\u0CA4\u0CBE\u0CA6 \u0C95\u0CC6\u0C82\u0CAA\u0CC1 \u0CAE\u0CA3\u0CCD\u0CA3\u0CC1 \u0C85\u0CA5\u0CB5\u0CBE \u0C97\u0CCB\u0CA1\u0CC1 \u0CAE\u0CA3\u0CCD\u0CA3\u0CC1 \u0CB8\u0CC2\u0C95\u0CCD\u0CA4 (pH 6.5 - 7.5).
2. **\u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CA8\u0CC6 \u0CB8\u0CAE\u0CAF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAC\u0CC0\u0C9C \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3:**
   - \u0CAE\u0CC1\u0C82\u0C97\u0CBE\u0CB0\u0CC1 (\u0C9C\u0CC2\u0CA8\u0CCD-\u0C9C\u0CC1\u0CB2\u0CC8) \u0C85\u0CA5\u0CB5\u0CBE \u0CB9\u0CBF\u0C82\u0C97\u0CBE\u0CB0\u0CC1 (\u0C85\u0C95\u0CCD\u0C9F\u0CCB\u0CAC\u0CB0\u0CCD-\u0CA8\u0CB5\u0CC6\u0C82\u0CAC\u0CB0\u0CCD).
   - \u0CAA\u0CCD\u0CB0\u0CA4\u0CBF \u0C8E\u0C95\u0CB0\u0CC6\u0C97\u0CC6 **7 \u0CB0\u0CBF\u0C82\u0CA6 8 \u0C95\u0CC6.\u0C9C\u0CBF \u0CB9\u0CC8\u0CAC\u0CCD\u0CB0\u0CBF\u0CA1\u0CCD \u0CAC\u0CC0\u0C9C** \u0CAC\u0CC7\u0C95\u0CBE\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CA6\u0CC6.
3. **\u0CB8\u0CBE\u0CB2\u0CC1 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C97\u0CBF\u0CA1\u0C97\u0CB3 \u0C85\u0C82\u0CA4\u0CB0:**
   - \u0CB8\u0CBE\u0CB2\u0CBF\u0CA8\u0CBF\u0C82\u0CA6 \u0CB8\u0CBE\u0CB2\u0CBF\u0C97\u0CC6 **60 \u0CB8\u0CC6\u0C82.\u0CAE\u0CC0 (2 \u0C85\u0CA1\u0CBF)** \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0C97\u0CBF\u0CA1\u0CA6\u0CBF\u0C82\u0CA6 \u0C97\u0CBF\u0CA1\u0C95\u0CCD\u0C95\u0CC6 **20 \u0CB8\u0CC6\u0C82.\u0CAE\u0CC0** \u0C85\u0C82\u0CA4\u0CB0\u0CB5\u0CBF\u0CB0\u0CB2\u0CBF.
4. **\u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CC6 (\u0CAA\u0CCD\u0CB0\u0CA4\u0CBF \u0C8E\u0C95\u0CB0\u0CC6\u0C97\u0CC6):**
   - \u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CA8\u0CC6\u0C97\u0CC6 \u0CAE\u0CC1\u0CA8\u0CCD\u0CA8 5 \u0C9F\u0CA8\u0CCD \u0C95\u0CCA\u0C9F\u0CCD\u0C9F\u0CBF\u0C97\u0CC6 \u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CAE\u0CA3\u0CCD\u0CA3\u0CBF\u0C97\u0CC6 \u0CAC\u0CC6\u0CB0\u0CC6\u0CB8\u0CBF.
   - \u0CB0\u0CB8\u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3: NPK 120:60:40 (\u0CA1\u0CBF\u0C8E\u0CAA\u0CBF 50 \u0C95\u0CC6.\u0C9C\u0CBF, \u0CAF\u0CC2\u0CB0\u0CBF\u0CAF\u0CBE 80 \u0C95\u0CC6.\u0C9C\u0CBF, \u0CAA\u0CCA\u0C9F\u0CCD\u0CAF\u0CBE\u0CB6\u0CCD 30 \u0C95\u0CC6.\u0C9C\u0CBF).
   - \u0CAF\u0CC2\u0CB0\u0CBF\u0CAF\u0CBE\u0CB5\u0CA8\u0CCD\u0CA8\u0CC1 3 \u0C95\u0C82\u0CA4\u0CC1\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF (\u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CA8\u0CC6 \u0CB5\u0CC7\u0CB3\u0CC6, 30 \u0CA6\u0CBF\u0CA8\u0C95\u0CCD\u0C95\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 50 \u0CA6\u0CBF\u0CA8\u0C95\u0CCD\u0C95\u0CC6) \u0CA8\u0CC0\u0CA1\u0CBF.
5. **\u0C95\u0CC0\u0C9F \u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CC6 (\u0CB2\u0CA6\u0CCD\u0CA6\u0CBF \u0CB9\u0CC1\u0CB3\u0CC1 - Fall Armyworm):**
   - \u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CA8\u0CC6\u0CAF 15-20 \u0CA6\u0CBF\u0CA8\u0C95\u0CCD\u0C95\u0CC6 \u0CB8\u0CC1\u0CB3\u0CBF\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CAC\u0CC7\u0CB5\u0CBF\u0CA8 \u0C95\u0CB7\u0CBE\u0CAF (5ml/L) \u0C85\u0CA5\u0CB5\u0CBE \u0C8E\u0CAE\u0CBE\u0CAE\u0CC6\u0C95\u0CCD\u0C9F\u0CBF\u0CA8\u0CCD \u0CAC\u0CC6\u0C82\u0C9C\u0CCA\u0CAF\u0CC7\u0C9F\u0CCD (0.4g/L) \u0CB8\u0CBF\u0C82\u0CAA\u0CA1\u0CBF\u0CB8\u0CBF.`;
    }
    if (langCode === "hi") {
      return `\u{1F33D} **\u092E\u0915\u094D\u0915\u093E (Corn / Maize) \u0915\u0940 \u0909\u0928\u094D\u0928\u0924 \u0916\u0947\u0924\u0940 - \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0917\u093E\u0907\u0921:**

1. **\u092D\u0942\u092E\u093F \u0915\u0940 \u0924\u0948\u092F\u093E\u0930\u0940:**
   - 2-3 \u0917\u0939\u0930\u0940 \u091C\u0941\u0924\u093E\u0908 \u0915\u0930\u0947\u0902 \u0914\u0930 5-6 \u091F\u0928 \u0938\u0921\u093C\u0940 \u0917\u094B\u092C\u0930 \u0915\u0940 \u0916\u093E\u0926 \u092A\u094D\u0930\u0924\u093F \u090F\u0915\u0921\u093C \u0905\u091A\u094D\u091B\u0940 \u0924\u0930\u0939 \u092E\u093F\u0932\u093E\u090F\u0902\u0964
   - \u092E\u093F\u091F\u094D\u091F\u0940 \u0915\u093E pH \u092E\u093E\u0928 6.0 \u0938\u0947 7.5 \u0915\u0947 \u092C\u0940\u091A \u0938\u092C\u0938\u0947 \u0909\u0924\u094D\u0924\u092E \u0939\u0948\u0964
2. **\u092C\u0941\u0935\u093E\u0908 \u0915\u093E \u0938\u092E\u092F \u090F\u0935\u0902 \u092C\u0940\u091C \u0926\u0930:**
   - \u0916\u0930\u0940\u092B: \u091C\u0942\u0928 \u0938\u0947 \u091C\u0941\u0932\u093E\u0908; \u0930\u092C\u0940: \u0905\u0915\u094D\u091F\u0942\u092C\u0930 \u0938\u0947 \u0928\u0935\u0902\u092C\u0930\u0964
   - \u092A\u094D\u0930\u0924\u093F \u090F\u0915\u0921\u093C **7-8 \u0915\u093F\u0932\u094B\u0917\u094D\u0930\u093E\u092E \u0938\u0902\u0915\u0930 (\u0939\u093E\u0907\u092C\u094D\u0930\u093F\u0921) \u092C\u0940\u091C** \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902\u0964
3. **\u0926\u0942\u0930\u0940 (\u0915\u0924\u093E\u0930 \u0914\u0930 \u092A\u094C\u0927\u0947):**
   - \u0915\u0924\u093E\u0930 \u0938\u0947 \u0915\u0924\u093E\u0930: **60 \u0938\u0947\u092E\u0940 (2 \u092B\u0940\u091F)**, \u092A\u094C\u0927\u0947 \u0938\u0947 \u092A\u094C\u0927\u0947 \u0915\u0940 \u0926\u0942\u0930\u0940: **20 \u0938\u0947 25 \u0938\u0947\u092E\u0940**\u0964
4. **\u0909\u0930\u094D\u0935\u0930\u0915 \u092A\u094D\u0930\u092C\u0902\u0927\u0928 (\u092A\u094D\u0930\u0924\u093F \u090F\u0915\u0921\u093C):**
   - \u0921\u0940\u090F\u092A\u0940: 50 \u0915\u093F\u0932\u094B, \u092A\u094B\u091F\u093E\u0936: 25 \u0915\u093F\u0932\u094B \u092C\u0941\u0935\u093E\u0908 \u0915\u0947 \u0938\u092E\u092F\u0964
   - \u092F\u0942\u0930\u093F\u092F\u093E: 75 \u0915\u093F\u0932\u094B (\u0924\u0940\u0928 \u092C\u093E\u0930 \u092E\u0947\u0902: \u092C\u0941\u0935\u093E\u0908, \u0918\u0941\u091F\u0928\u0947 \u0915\u0940 \u090A\u0902\u091A\u093E\u0908 \u092A\u0930, \u0914\u0930 \u0928\u0930 \u092E\u0902\u091C\u0930\u0940 \u0906\u0928\u0947 \u092A\u0930)\u0964
5. **\u092B\u0949\u0932 \u0906\u0930\u094D\u092E\u0940\u0935\u0949\u0930\u094D\u092E (\u0938\u0948\u0928\u093F\u0915 \u0915\u0940\u091F) \u0915\u0940 \u0930\u094B\u0915\u0925\u093E\u092E:**
   - \u092B\u0947\u0930\u094B\u092E\u094B\u0928 \u091F\u094D\u0930\u0948\u092A \u0932\u0917\u093E\u090F\u0902\u0964 \u092A\u094D\u0930\u0915\u094B\u092A \u0926\u093F\u0916\u0928\u0947 \u092A\u0930 \u0907\u092E\u093E\u092E\u0947\u0915\u094D\u091F\u093F\u0928 \u092C\u0947\u0902\u091C\u094B\u090F\u091F 5% \u090F\u0938\u091C\u0940 @ 0.4 \u0917\u094D\u0930\u093E\u092E \u092A\u094D\u0930\u0924\u093F \u0932\u0940\u091F\u0930 \u092A\u093E\u0928\u0940 \u0915\u093E \u091B\u093F\u0921\u093C\u0915\u093E\u0935 \u0915\u0930\u0947\u0902\u0964`;
    }
    return `\u{1F33D} **Complete Commercial Guide to Growing Corn (Maize):**

1. **Soil & Land Preparation:**
   - Well-drained sandy loam or clay loam rich in organic matter (pH 6.0 - 7.5).
   - Incorporate 5\u20136 tons of well-decomposed farmyard manure (FYM) per acre during primary tillage.
2. **Sowing Season & Seed Rate:**
   - **Kharif (Monsoon):** June - July | **Rabi (Winter):** October - November.
   - Seed rate: **7 to 8 kg/acre** of certified high-yielding hybrid seeds.
3. **Plant Spacing:**
   - Row-to-Row: **60 cm (24 inches)** | Plant-to-Plant: **20\u201325 cm (8\u201310 inches)**. Sowing depth: 3 to 5 cm.
4. **Fertilizer Schedule (Per Acre):**
   - **Basal application:** 50 kg DAP + 25 kg MOP (Potash) + 10 kg Zinc Sulphate.
   - **Nitrogen top-dressing (Urea 70 kg total):** Split into 3 equal doses \u2014 at 25 days (knee-high stage), 45 days (tasseling), and 60 days (silking stage).
5. **Critical Irrigation Stages:**
   - Knee-high stage (30 days), Tasseling / Flowering stage (45-55 days), and Grain filling stage (65-75 days). Water stress at flowering can reduce yield by up to 40%.
6. **Fall Armyworm (FAW) Management:**
   - Install 4\u20135 pheromone traps per acre.
   - Spray *Bacillus thuringiensis* (Bt) @ 2g/L or Emamectin Benzoate 5% SG @ 0.4g/L directed into the crop whorl.`;
  }
  if (langCode === "kn") {
    return `\u{1F33E} **\u0CB9\u0CB8\u0CBF\u0CB0\u0CC1 \u0C95\u0CC3\u0CB7\u0CBF \u0CAC\u0CC6\u0CB3\u0CC6 \u0CAC\u0CC6\u0CB3\u0CC6\u0CAF\u0CC1\u0CB5 \u0CAE\u0CC2\u0CB2 \u0CA4\u0CA4\u0CCD\u0CB5\u0C97\u0CB3\u0CC1 (GreenGrow AI):**

1. **\u0CAE\u0CA3\u0CCD\u0CA3\u0CC1 \u0CAA\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CA4\u0CAF\u0CBE\u0CB0\u0CBF:**
   - \u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CA8\u0CC6\u0C97\u0CC6 \u0CAE\u0CC1\u0CA8\u0CCD\u0CA8 \u0CAE\u0CA3\u0CCD\u0CA3\u0CC1 \u0CAA\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CC6 \u0CAE\u0CBE\u0CA1\u0CBF\u0CB8\u0CBF. \u0C9C\u0CAE\u0CC0\u0CA8\u0CBF\u0C97\u0CC6 \u0C8E\u0C95\u0CB0\u0CC6\u0C97\u0CC6 5 \u0C9F\u0CA8\u0CCD \u0C95\u0CBE\u0C82\u0CAA\u0CCB\u0CB8\u0CCD\u0C9F\u0CCD \u0C85\u0CA5\u0CB5\u0CBE \u0C8E\u0CB0\u0CC6\u0CB9\u0CC1\u0CB3\u0CC1 \u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0 \u0CB8\u0CC7\u0CB0\u0CBF\u0CB8\u0CBF.
2. **\u0C97\u0CC1\u0CA3\u0CAE\u0C9F\u0CCD\u0C9F\u0CA6 \u0CAC\u0CC0\u0C9C \u0C86\u0CAF\u0CCD\u0C95\u0CC6 \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAC\u0CC0\u0C9C\u0CCB\u0CAA\u0C9A\u0CBE\u0CB0:**
   - \u0CB0\u0CCB\u0C97\u0CAE\u0CC1\u0C95\u0CCD\u0CA4 \u0CAA\u0CCD\u0CB0\u0CAE\u0CBE\u0CA3\u0CC0\u0C95\u0CC3\u0CA4 \u0CAC\u0CC0\u0C9C\u0C97\u0CB3\u0CA8\u0CCD\u0CA8\u0CC1 \u0C86\u0CAF\u0CCD\u0C95\u0CC6\u0CAE\u0CBE\u0CA1\u0CBF. \u0CAC\u0CC0\u0C9C \u0CAC\u0CBF\u0CA4\u0CCD\u0CA4\u0CC1\u0CB5 \u0CAE\u0CC1\u0CA8\u0CCD\u0CA8 \u0C9F\u0CCD\u0CB0\u0CC8\u0C95\u0CCB\u0CA1\u0CB0\u0CCD\u0CAE\u0CBE (10 \u0C97\u0CCD\u0CB0\u0CBE\u0C82/\u0C95\u0CC6.\u0C9C\u0CBF) \u0C85\u0CA5\u0CB5\u0CBE \u0CB0\u0CC8\u0C9C\u0CCB\u0CAC\u0CBF\u0CAF\u0C82 \u0C9C\u0CC8\u0CB5\u0CBF\u0C95 \u0C97\u0CCA\u0CAC\u0CCD\u0CAC\u0CB0\u0CA6\u0CBF\u0C82\u0CA6 \u0CB8\u0C82\u0CB8\u0CCD\u0C95\u0CB0\u0CBF\u0CB8\u0CBF.
3. **\u0CB8\u0CAE\u0CA4\u0CCB\u0CB2\u0CBF\u0CA4 \u0CAA\u0CCB\u0CB7\u0C95\u0CBE\u0C82\u0CB6 \u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CC6:**
   - \u0CB8\u0CBE\u0CB0\u0C9C\u0CA8\u0C95, \u0CB0\u0C82\u0C9C\u0C95, \u0CAA\u0CCA\u0C9F\u0CCD\u0CAF\u0CBE\u0CB6\u0CCD (NPK) \u0C9C\u0CCA\u0CA4\u0CC6\u0C97\u0CC6 \u0CB2\u0C98\u0CC1 \u0CAA\u0CCB\u0CB7\u0C95\u0CBE\u0C82\u0CB6\u0C97\u0CB3\u0CBE\u0CA6 \u0CB8\u0CA4\u0CC1 (Zinc) \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAC\u0CCB\u0CB0\u0CBE\u0CA8\u0CCD \u0CA8\u0CC0\u0CA1\u0CBF.
4. **\u0CB5\u0CC8\u0C9C\u0CCD\u0C9E\u0CBE\u0CA8\u0CBF\u0C95 \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF:**
   - \u0CB9\u0CA8\u0CBF \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF \u0C85\u0CA5\u0CB5\u0CBE \u0CA4\u0CC1\u0C82\u0CA4\u0CC1\u0CB0\u0CC1 \u0CA8\u0CC0\u0CB0\u0CBE\u0CB5\u0CB0\u0CBF \u0CAC\u0CB3\u0CB8\u0CBF \u0CB6\u0CC7. 50% \u0CA8\u0CC0\u0CB0\u0CC1 \u0C89\u0CB3\u0CBF\u0CB8\u0CBF.
5. **\u0CB8\u0CAE\u0C97\u0CCD\u0CB0 \u0C95\u0CC0\u0C9F \u0CA8\u0CBF\u0CB0\u0CCD\u0CB5\u0CB9\u0CA3\u0CC6 (IPM):**
   - \u0CB9\u0CB3\u0CA6\u0CBF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CA8\u0CC0\u0CB2\u0CBF \u0C85\u0C82\u0C9F\u0CBF\u0CA8 \u0CAC\u0CB2\u0CC6\u0C97\u0CB3\u0CA8\u0CCD\u0CA8\u0CC1 (Sticky Traps) \u0C8E\u0C95\u0CB0\u0CC6\u0C97\u0CC6 10-12 \u0C95\u0CA1\u0CC6 \u0C95\u0C9F\u0CCD\u0C9F\u0CBF. \u0CB0\u0CB8\u0CB9\u0CC0\u0CB0\u0CC1\u0CB5 \u0C95\u0CC0\u0C9F\u0C97\u0CB3\u0CBF\u0C97\u0CC6 \u0CAC\u0CC7\u0CB5\u0CBF\u0CA8 \u0C8E\u0CA3\u0CCD\u0CA3\u0CC6 \u0CB8\u0CBF\u0C82\u0CAA\u0CA1\u0CBF\u0CB8\u0CBF.`;
  }
  if (langCode === "hi") {
    return `\u{1F33E} **\u0938\u092B\u0932 \u090F\u0935\u0902 \u0932\u093E\u092D\u0926\u093E\u092F\u0915 \u092B\u0938\u0932 \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0915\u0947 \u092E\u0941\u0916\u094D\u092F \u0928\u093F\u092F\u092E (GreenGrow AI):**

1. **\u0916\u0947\u0924 \u0915\u0940 \u0924\u0948\u092F\u093E\u0930\u0940 \u090F\u0935\u0902 \u092E\u093F\u091F\u094D\u091F\u0940 \u092A\u0930\u0940\u0915\u094D\u0937\u0923:**
   - \u092C\u0941\u0935\u093E\u0908 \u0938\u0947 \u092A\u0939\u0932\u0947 \u092E\u093F\u091F\u094D\u091F\u0940 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0915\u0930\u093E\u090F\u0902\u0964 \u0916\u0947\u0924 \u092E\u0947\u0902 5-6 \u091F\u0928 \u0938\u0921\u093C\u093E \u0939\u0941\u0906 \u0917\u094B\u092C\u0930 \u092F\u093E \u0915\u0947\u0902\u091A\u0941\u090F \u0915\u0940 \u0916\u093E\u0926 (\u0935\u0930\u094D\u092E\u0940\u0915\u092E\u094D\u092A\u094B\u0938\u094D\u091F) \u0905\u091A\u094D\u091B\u0940 \u0924\u0930\u0939 \u092E\u093F\u0932\u093E\u090F\u0902\u0964
2. **\u092C\u0940\u091C \u0909\u092A\u091A\u093E\u0930 (Seed Treatment):**
   - \u092B\u092B\u0942\u0902\u0926\u0928\u093E\u0936\u0915 (\u0925\u093E\u092F\u0930\u093E\u092E / \u092C\u093E\u0935\u093F\u0938\u094D\u091F\u093F\u0928 2 \u0917\u094D\u0930\u093E\u092E/\u0915\u093F\u0917\u094D\u0930\u093E) \u092F\u093E \u091C\u0948\u0935\u093F\u0915 \u091F\u094D\u0930\u093E\u0907\u0915\u094B\u0921\u0930\u094D\u092E\u093E (5 \u0917\u094D\u0930\u093E\u092E/\u0915\u093F\u0917\u094D\u0930\u093E) \u0938\u0947 \u092C\u0940\u091C \u0936\u094B\u0927\u0928 \u0905\u0935\u0936\u094D\u092F \u0915\u0930\u0947\u0902\u0964
3. **\u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u092A\u094B\u0937\u0915 \u0924\u0924\u094D\u0935 \u092A\u094D\u0930\u092C\u0902\u0927\u0928:**
   - NPK \u0915\u0947 \u0938\u093E\u0925-\u0938\u093E\u0925 \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u092A\u094B\u0937\u0915 \u0924\u0924\u094D\u0935 (\u091C\u093F\u0902\u0915 \u0938\u0932\u094D\u092B\u0947\u091F, \u0938\u0932\u094D\u092B\u0930 \u0914\u0930 \u092C\u094B\u0930\u0949\u0928) \u0915\u093E \u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u092A\u094D\u0930\u092F\u094B\u0917 \u0915\u0930\u0947\u0902\u0964
4. **\u0909\u091A\u093F\u0924 \u0938\u093F\u0902\u091A\u093E\u0908 \u0938\u092E\u092F:**
   - \u0921\u094D\u0930\u093F\u092A \u092F\u093E \u0938\u094D\u092A\u094D\u0930\u093F\u0902\u0915\u0932\u0930 \u0938\u093F\u0902\u091A\u093E\u0908 \u0905\u092A\u0928\u093E\u090F\u0902\u0964 \u092B\u0938\u0932 \u0915\u0947 \u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u091A\u0930\u0923\u094B\u0902 (\u092B\u0942\u0932 \u0906\u0928\u0947 \u0935 \u0926\u093E\u0928\u093E \u092D\u0930\u0928\u0947) \u092A\u0930 \u0928\u092E\u0940 \u092C\u0928\u093E\u090F \u0930\u0916\u0947\u0902\u0964
5. **\u0915\u0940\u091F \u090F\u0935\u0902 \u0930\u094B\u0917 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923:**
   - \u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u0915\u0940\u091F\u0928\u093E\u0936\u0915\u094B\u0902 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0928\u0940\u092E \u0915\u093E \u0924\u0947\u0932 (1500 ppm), \u092A\u0940\u0932\u093E \u0938\u094D\u091F\u093F\u0915\u0940 \u091F\u094D\u0930\u0948\u092A \u0914\u0930 \u092B\u0947\u0930\u094B\u092E\u094B\u0928 \u091F\u094D\u0930\u0948\u092A \u0905\u092A\u0928\u093E\u090F\u0902\u0964`;
  }
  return `\u{1F33E} **Essential Principles for High-Yield Crop Cultivation (GreenGrow AI):**

1. **Soil Health & Land Preparation:**
   - Deep plough during summer to destroy dormant pest pupae and weed seeds.
   - Incorporate 5\u20138 tons/acre of organic compost or vermicompost to improve microbial biodiversity and water retention.
2. **Certified Seed Selection & Inoculation:**
   - Use high-germination certified seed varieties adapted to your agro-climatic zone.
   - Treat seeds with *Trichoderma viride* (10g/kg) or Azotobacter / Rhizobium bio-fertilizers to boost early root vigor and disease immunity.
3. **Balanced Plant Nutrition (Integrated Nutrient Management):**
   - Apply base fertilizers (Phosphorus and Potassium) during sowing.
   - Split Nitrogen application into 2\u20133 vegetative stages to prevent leaching.
   - Supplement with foliar micronutrients (Zinc, Boron, Ferrous sulphate) at 30 and 45 days.
4. **Water Stewardship:**
   - Adopt micro-irrigation (Drip or Sprinkler). Avoid waterlogging during vegetative stages.
5. **Integrated Pest Management (IPM):**
   - Install yellow sticky traps (10/acre) for sucking pests (whiteflies, thrips).
   - Use botanical neem oil spray (3-5 ml/L) as first-line defense before resorting to targeted chemical controls.`;
}
async function transcribeAudioWithGemini(options) {
  const { audioBase64, mimeType = "audio/webm", language } = options;
  const langName = language?.name || "English";
  const langNative = language?.nativeName ? ` (${language.nativeName})` : "";
  const langCode = language?.code || "en";
  const cleanMime = (mimeType || "audio/webm").split(";")[0].trim();
  try {
    const ai = getGeminiClient();
    if (ai) {
      const primaryModel = config.gemini.model || "gemini-2.0-flash";
      const candidateModels = Array.from(
        /* @__PURE__ */ new Set([primaryModel, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"])
      );
      for (const targetModel of candidateModels) {
        try {
          logger.info(`Transcribing audio with Gemini model: ${targetModel} in language: ${langName} (${langCode}) [mime: ${cleanMime}]`);
          const response = await ai.models.generateContent({
            model: targetModel,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: audioBase64
                    }
                  },
                  {
                    text: `You are a professional verbatim speech-to-text transcriber for the GreenGrow application.
Target language: ${langName}${langNative} [code: ${langCode}].
Please transcribe the spoken audio into text.

CRITICAL INSTRUCTIONS:
1. Transcribe ONLY the exact words actually spoken by the human speaker in the audio clip.
2. NEVER invent, hallucinate, guess, or make up questions or sentences (e.g. NEVER make up "Where can I find the fertilizer recommendations" or any other question).
3. If the audio is silent, contains only background static/noise, or if no intelligible words were spoken, you MUST respond with EXACTLY: NO_SPEECH
4. Output ONLY the raw transcribed words in ${langName} using its proper script. Do NOT add any preamble, conversational answer, notes, or quotation marks.`
                  }
                ]
              }
            ]
          });
          let text = (response.text || "").trim();
          if (text.includes("NO_SPEECH") || text === '""' || text === "''") {
            return "";
          }
          return text;
        } catch (err) {
          logger.warn(`Model ${targetModel} transcription failed: ${err.message}. Trying next candidate...`);
        }
      }
    }
  } catch (err) {
    logger.warn("Audio transcription failed or client unavailable:", err?.message || err);
  }
  return "";
}

// backend/src/services/supabaseService.ts
import { createClient } from "@supabase/supabase-js";
var supabaseClient = null;
function isSupabaseConfigured() {
  return Boolean(
    config.supabase.url && config.supabase.url.startsWith("https://") && config.supabase.anonKey && config.supabase.anonKey !== "your_supabase_anon_key"
  );
}
function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
      logger.info("Supabase client initialized.");
    } catch (err) {
      logger.error("Failed to initialize Supabase client:", err.message);
    }
  }
  return supabaseClient;
}
function createSupabaseUserClient(authToken) {
  if (!isSupabaseConfigured()) return null;
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  });
}
var inMemoryConversations = /* @__PURE__ */ new Map();
var inMemoryProfiles = /* @__PURE__ */ new Map();
var demoStore = {
  getConversations(userId) {
    return Array.from(inMemoryConversations.values()).filter((c) => c.user_id === userId).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },
  getConversation(id, userId) {
    const conv = inMemoryConversations.get(id);
    if (conv && conv.user_id === userId) return conv;
    return void 0;
  },
  saveConversation(conv) {
    inMemoryConversations.set(conv.id, conv);
  },
  deleteConversation(id, userId) {
    const conv = inMemoryConversations.get(id);
    if (conv && conv.user_id === userId) {
      inMemoryConversations.delete(id);
      return true;
    }
    return false;
  },
  getProfile(userId) {
    return inMemoryProfiles.get(userId) || {
      id: userId,
      full_name: "Guest Farmer",
      preferred_language: "en",
      country_code: "",
      region: "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  },
  saveProfile(userId, data) {
    const current = demoStore.getProfile(userId);
    const updated = { ...current, ...data, id: userId };
    inMemoryProfiles.set(userId, updated);
    return updated;
  }
};

// backend/src/controllers/chatController.ts
import crypto from "crypto";
async function handleChatMessage(req, res) {
  try {
    const {
      message = "",
      image,
      imageMimeType,
      history = [],
      language = { code: "en", name: "English" },
      country,
      region,
      conversationId: clientConversationId
    } = req.body;
    if ((!message || !message.trim()) && !image) {
      return res.status(400).json({
        success: false,
        error: "Please enter a farming question or take/upload a crop photo."
      });
    }
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    logger.info(`Chat request received from user: ${userId} (${isGuest ? "guest" : "authenticated"})${image ? " [with crop photo]" : ""}`);
    const assistantReply = await generateAgricultureResponse({
      message,
      image,
      imageMimeType,
      history,
      language,
      country,
      region
    });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userMsgObj = {
      role: "user",
      content: message?.trim() || "\u{1F331} Plant / Crop Image Analysis",
      timestamp: now
    };
    if (image) {
      userMsgObj.image = image;
      userMsgObj.imageMimeType = imageMimeType || "image/jpeg";
    }
    const assistantMsgObj = {
      role: "assistant",
      content: assistantReply,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    let activeConvId = clientConversationId;
    const defaultTitle = image ? "\u{1F331} Plant Photo Diagnosis" : "Farming Consultation";
    const cleanTitle = message && message.trim().length > 0 ? message.length > 40 ? `${message.substring(0, 40)}...` : message : defaultTitle;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      try {
        const client = req.supabaseUserClient;
        if (activeConvId) {
          const { data: existing } = await client.from("conversations").select("messages, title").eq("id", activeConvId).single();
          const updatedMessages = existing?.messages ? [...existing.messages, userMsgObj, assistantMsgObj] : [userMsgObj, assistantMsgObj];
          await client.from("conversations").update({
            messages: updatedMessages,
            updated_at: now
          }).eq("id", activeConvId);
        } else {
          const { data: newConv, error: insertError } = await client.from("conversations").insert({
            user_id: userId,
            title: cleanTitle,
            preferred_language: language.code || "en",
            messages: [userMsgObj, assistantMsgObj],
            created_at: now,
            updated_at: now
          }).select("id").single();
          if (!insertError && newConv) {
            activeConvId = newConv.id;
          }
        }
      } catch (dbErr) {
        logger.warn("Error persisting conversation to Supabase:", dbErr.message);
      }
    } else {
      if (!activeConvId) {
        activeConvId = crypto.randomUUID();
        demoStore.saveConversation({
          id: activeConvId,
          user_id: userId,
          title: cleanTitle,
          preferred_language: language.code || "en",
          messages: [userMsgObj, assistantMsgObj],
          created_at: now,
          updated_at: now
        });
      } else {
        const existing = demoStore.getConversation(activeConvId, userId);
        const updatedMessages = existing ? [...existing.messages, userMsgObj, assistantMsgObj] : [userMsgObj, assistantMsgObj];
        demoStore.saveConversation({
          id: activeConvId,
          user_id: userId,
          title: existing?.title || cleanTitle,
          preferred_language: language.code || "en",
          messages: updatedMessages,
          created_at: existing?.created_at || now,
          updated_at: now
        });
      }
    }
    return res.status(200).json({
      success: true,
      response: assistantReply,
      conversationId: activeConvId,
      message: assistantMsgObj
    });
  } catch (error) {
    logger.error("Error handling chat message:", error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating the agriculture guidance."
    });
  }
}
async function handleAudioTranscribe(req, res) {
  try {
    const { audio, mimeType = "audio/webm", language = { code: "en", name: "English" } } = req.body;
    if (!audio || typeof audio !== "string") {
      return res.status(400).json({ success: false, error: "Audio base64 data is required." });
    }
    const cleanBase64 = audio.includes(",") ? audio.split(",")[1] : audio;
    const cleanMime = (mimeType || "audio/webm").split(";")[0].trim();
    logger.info(`Received voice audio for transcription: mimeType=${cleanMime}, size=${cleanBase64.length} chars, language=${language.name}`);
    const transcript = await transcribeAudioWithGemini({
      audioBase64: cleanBase64,
      mimeType: cleanMime,
      language
    });
    return res.status(200).json({
      success: true,
      transcript
    });
  } catch (error) {
    logger.error("Error during audio transcription:", error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || "Audio transcription failed. Please try typing your question."
    });
  }
}

// backend/src/middleware/authMiddleware.ts
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const guestHeaderId = req.headers["x-guest-user-id"];
  if (authHeader && authHeader.startsWith("Bearer ") && isSupabaseConfigured()) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            req.user = {
              id: user.id,
              email: user.email,
              isGuest: false
            };
            req.supabaseUserClient = createSupabaseUserClient(token);
            return next();
          }
        }
      } catch (err) {
        logger.warn("Token verification error:", err.message);
      }
    }
  }
  const effectiveGuestId = guestHeaderId || "guest-farmer-default";
  req.user = {
    id: effectiveGuestId,
    email: "farmer@greengrow.local",
    isGuest: true
  };
  return next();
}

// backend/src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var limiter = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 60,
  // limit each IP to 60 chat requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.length > 0) {
      return realIp.trim();
    }
    return req.socket?.remoteAddress || "127.0.0.1";
  },
  message: {
    success: false,
    error: "Too many messages sent. Please slow down and try again in a minute."
  }
});
function chatRateLimiter(req, res, next) {
  if (process.env.VERCEL) {
    return next();
  }
  return limiter(req, res, next);
}

// backend/src/data/languages.json
var languages_default = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    country: "United States",
    region: "Global",
    type: "international",
    supportStatus: "available",
    speechCode: "en-US",
    popular: true
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "\u0939\u093F\u0928\u094D\u0926\u0940",
    country: "India",
    region: "North & Central India",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: true
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1",
    country: "India",
    region: "Karnataka",
    type: "regional",
    supportStatus: "available",
    speechCode: "kn-IN",
    popular: true
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41",
    country: "India",
    region: "Andhra Pradesh & Telangana",
    type: "regional",
    supportStatus: "available",
    speechCode: "te-IN",
    popular: true
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD",
    country: "India",
    region: "Tamil Nadu",
    type: "regional",
    supportStatus: "available",
    speechCode: "ta-IN",
    popular: true
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "\u092E\u0930\u093E\u0920\u0940",
    country: "India",
    region: "Maharashtra",
    type: "regional",
    supportStatus: "available",
    speechCode: "mr-IN",
    popular: true
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02",
    country: "India",
    region: "Kerala",
    type: "regional",
    supportStatus: "available",
    speechCode: "ml-IN",
    popular: true
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0",
    country: "India",
    region: "Gujarat",
    type: "regional",
    supportStatus: "available",
    speechCode: "gu-IN",
    popular: true
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "\u09AC\u09BE\u0982\u09B2\u09BE",
    country: "India",
    region: "West Bengal & Tripura",
    type: "regional",
    supportStatus: "available",
    speechCode: "bn-IN",
    popular: true
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40",
    country: "India",
    region: "Punjab",
    type: "regional",
    supportStatus: "available",
    speechCode: "pa-IN",
    popular: true
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "\u0B13\u0B21\u0B3C\u0B3F\u0B06",
    country: "India",
    region: "Odisha",
    type: "regional",
    supportStatus: "available",
    speechCode: "or-IN",
    popular: false
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE",
    country: "India",
    region: "Assam",
    type: "regional",
    supportStatus: "available",
    speechCode: "as-IN",
    popular: false
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "\u0627\u0631\u062F\u0648",
    country: "India",
    region: "Delhi, Uttar Pradesh, Telangana, J&K",
    type: "regional",
    supportStatus: "available",
    speechCode: "ur-IN",
    popular: true
  },
  {
    code: "bho",
    name: "Bhojpuri",
    nativeName: "\u092D\u094B\u091C\u092A\u0941\u0930\u0940",
    country: "India",
    region: "Bihar & Uttar Pradesh",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "mai",
    name: "Maithili",
    nativeName: "\u092E\u0948\u0925\u093F\u0932\u0940",
    country: "India",
    region: "Bihar",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "kok",
    name: "Konkani",
    nativeName: "\u0915\u094B\u0902\u0915\u0923\u0940",
    country: "India",
    region: "Goa, Karnataka, Maharashtra",
    type: "regional",
    supportStatus: "available",
    speechCode: "mr-IN",
    popular: false
  },
  {
    code: "tcy",
    name: "Tulu",
    nativeName: "\u0CA4\u0CC1\u0CB3\u0CC1",
    country: "India",
    region: "Karnataka (Dakshina Kannada/Udupi)",
    type: "regional",
    supportStatus: "limited",
    speechCode: "kn-IN",
    popular: false
  },
  {
    code: "kfa",
    name: "Kodava",
    nativeName: "\u0C95\u0CCA\u0CA1\u0CB5 \u0CA4\u0C95\u0CCD\u0C95\u0CCD",
    country: "India",
    region: "Karnataka (Kodagu)",
    type: "regional",
    supportStatus: "limited",
    speechCode: "kn-IN",
    popular: false
  },
  {
    code: "ks",
    name: "Kashmiri",
    nativeName: "\u06A9\u0672\u0634\u064F\u0631",
    country: "India",
    region: "Jammu and Kashmir",
    type: "regional",
    supportStatus: "limited",
    speechCode: "ur-IN",
    popular: false
  },
  {
    code: "doi",
    name: "Dogri",
    nativeName: "\u0921\u094B\u0917\u0930\u0940",
    country: "India",
    region: "Jammu and Kashmir",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "sat",
    name: "Santali",
    nativeName: "\u1C65\u1C5F\u1C71\u1C5B\u1C5F\u1C72\u1C64",
    country: "India",
    region: "Jharkhand, Odisha, West Bengal",
    type: "regional",
    supportStatus: "limited",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "\u0928\u0947\u092A\u093E\u0932\u0940",
    country: "Nepal",
    region: "Sikkim, West Bengal, Nepal",
    type: "regional",
    supportStatus: "available",
    speechCode: "ne-NP",
    popular: false
  },
  {
    code: "bgc",
    name: "Haryanvi",
    nativeName: "\u0939\u0930\u093F\u092F\u093E\u0923\u0935\u0940",
    country: "India",
    region: "Haryana",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "raj",
    name: "Rajasthani",
    nativeName: "\u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928\u0940",
    country: "India",
    region: "Rajasthan",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "hne",
    name: "Chhattisgarhi",
    nativeName: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940",
    country: "India",
    region: "Chhattisgarh",
    type: "regional",
    supportStatus: "available",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "gbm",
    name: "Garhwali",
    nativeName: "\u0917\u0922\u093C\u0935\u093E\u0932\u0940",
    country: "India",
    region: "Uttarakhand",
    type: "regional",
    supportStatus: "limited",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "kfy",
    name: "Kumaoni",
    nativeName: "\u0915\u0941\u092E\u093E\u090A\u0901\u0928\u0940",
    country: "India",
    region: "Uttarakhand",
    type: "regional",
    supportStatus: "limited",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "mni",
    name: "Meitei (Manipuri)",
    nativeName: "\u09AE\u09C8\u09A4\u09C8\u09B2\u09CB\u09A8\u09CD",
    country: "India",
    region: "Manipur",
    type: "regional",
    supportStatus: "available",
    speechCode: "bn-IN",
    popular: false
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "\u092C\u0921\u093C\u094B",
    country: "India",
    region: "Assam",
    type: "regional",
    supportStatus: "limited",
    speechCode: "as-IN",
    popular: false
  },
  {
    code: "kha",
    name: "Khasi",
    nativeName: "Ka Ktien Khasi",
    country: "India",
    region: "Meghalaya",
    type: "regional",
    supportStatus: "limited",
    speechCode: "en-IN",
    popular: false
  },
  {
    code: "grt",
    name: "Garo",
    nativeName: "A\xB7chik",
    country: "India",
    region: "Meghalaya",
    type: "regional",
    supportStatus: "limited",
    speechCode: "en-IN",
    popular: false
  },
  {
    code: "lus",
    name: "Mizo",
    nativeName: "Mizo \u1E6Dawng",
    country: "India",
    region: "Mizoram",
    type: "regional",
    supportStatus: "limited",
    speechCode: "en-IN",
    popular: false
  },
  {
    code: "trp",
    name: "Kokborok",
    nativeName: "Kokborok",
    country: "India",
    region: "Tripura",
    type: "regional",
    supportStatus: "limited",
    speechCode: "bn-IN",
    popular: false
  },
  {
    code: "lbj",
    name: "Ladakhi",
    nativeName: "\u0F63\u0F0B\u0F51\u0FAD\u0F42\u0F66\u0F0B\u0F66\u0F90\u0F51\u0F0B",
    country: "India",
    region: "Ladakh",
    type: "regional",
    supportStatus: "limited",
    speechCode: "hi-IN",
    popular: false
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Espa\xF1ol",
    country: "Spain",
    region: "Europe & Latin America",
    type: "international",
    supportStatus: "available",
    speechCode: "es-ES",
    popular: true
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Fran\xE7ais",
    country: "France",
    region: "Europe, Canada & Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "fr-FR",
    popular: true
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    country: "Germany",
    region: "Central Europe",
    type: "international",
    supportStatus: "available",
    speechCode: "de-DE",
    popular: true
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Portugu\xEAs",
    country: "Brazil",
    region: "South America & Europe",
    type: "international",
    supportStatus: "available",
    speechCode: "pt-BR",
    popular: true
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    country: "Italy",
    region: "Southern Europe",
    type: "international",
    supportStatus: "available",
    speechCode: "it-IT",
    popular: false
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    country: "Netherlands",
    region: "Western Europe",
    type: "international",
    supportStatus: "available",
    speechCode: "nl-NL",
    popular: false
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
    country: "Russia",
    region: "Eastern Europe & Central Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "ru-RU",
    popular: true
  },
  {
    code: "zh",
    name: "Mandarin Chinese",
    nativeName: "\u4E2D\u6587 (\u7B80\u4F53)",
    country: "China",
    region: "East Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "zh-CN",
    popular: true
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "\u65E5\u672C\u8A9E",
    country: "Japan",
    region: "East Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "ja-JP",
    popular: true
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "\uD55C\uAD6D\uC5B4",
    country: "South Korea",
    region: "East Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "ko-KR",
    popular: false
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    country: "Indonesia",
    region: "Southeast Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "id-ID",
    popular: true
  },
  {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    country: "Malaysia",
    region: "Southeast Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "ms-MY",
    popular: false
  },
  {
    code: "th",
    name: "Thai",
    nativeName: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22",
    country: "Thailand",
    region: "Southeast Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "th-TH",
    popular: false
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Ti\u1EBFng Vi\u1EC7t",
    country: "Vietnam",
    region: "Southeast Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "vi-VN",
    popular: true
  },
  {
    code: "fil",
    name: "Filipino",
    nativeName: "Filipino",
    country: "Philippines",
    region: "Southeast Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "fil-PH",
    popular: false
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
    country: "Saudi Arabia",
    region: "Middle East & North Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "ar-SA",
    popular: true
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "T\xFCrk\xE7e",
    country: "Turkey",
    region: "Middle East & Europe",
    type: "international",
    supportStatus: "available",
    speechCode: "tr-TR",
    popular: false
  },
  {
    code: "fa",
    name: "Persian",
    nativeName: "\u0641\u0627\u0631\u0633\u06CC",
    country: "Iran",
    region: "Middle East",
    type: "international",
    supportStatus: "available",
    speechCode: "fa-IR",
    popular: false
  },
  {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    country: "Kenya",
    region: "East Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "sw-KE",
    popular: true
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "\u12A0\u121B\u122D\u129B",
    country: "Ethiopia",
    region: "East Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "am-ET",
    popular: false
  },
  {
    code: "ha",
    name: "Hausa",
    nativeName: "Harshen Hausa",
    country: "Nigeria",
    region: "West Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "ha-NG",
    popular: false
  },
  {
    code: "yo",
    name: "Yoruba",
    nativeName: "\xC8d\xE8 Yor\xF9b\xE1",
    country: "Nigeria",
    region: "West Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "yo-NG",
    popular: false
  },
  {
    code: "ig",
    name: "Igbo",
    nativeName: "As\u1EE5s\u1EE5 Igbo",
    country: "Nigeria",
    region: "West Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "ig-NG",
    popular: false
  },
  {
    code: "zu",
    name: "Zulu",
    nativeName: "isiZulu",
    country: "South Africa",
    region: "Southern Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "zu-ZA",
    popular: false
  },
  {
    code: "xh",
    name: "Xhosa",
    nativeName: "isiXhosa",
    country: "South Africa",
    region: "Southern Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "xh-ZA",
    popular: false
  },
  {
    code: "af",
    name: "Afrikaans",
    nativeName: "Afrikaans",
    country: "South Africa",
    region: "Southern Africa",
    type: "international",
    supportStatus: "available",
    speechCode: "af-ZA",
    popular: false
  },
  {
    code: "ps",
    name: "Pashto",
    nativeName: "\u067E\u069A\u062A\u0648",
    country: "Afghanistan",
    region: "Central & South Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "ps-AF",
    popular: false
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "\u0633\u0646\u068C\u064A",
    country: "Pakistan",
    region: "South Asia",
    type: "international",
    supportStatus: "available",
    speechCode: "sd-PK",
    popular: false
  },
  {
    code: "cy",
    name: "Welsh",
    nativeName: "Cymraeg",
    country: "United Kingdom",
    region: "Wales",
    type: "international",
    supportStatus: "available",
    speechCode: "cy-GB",
    popular: false
  },
  {
    code: "ca",
    name: "Catalan",
    nativeName: "Catal\xE0",
    country: "Spain",
    region: "Catalonia",
    type: "international",
    supportStatus: "available",
    speechCode: "ca-ES",
    popular: false
  },
  {
    code: "gl",
    name: "Galician",
    nativeName: "Galego",
    country: "Spain",
    region: "Galicia",
    type: "international",
    supportStatus: "available",
    speechCode: "gl-ES",
    popular: false
  },
  {
    code: "eu",
    name: "Basque",
    nativeName: "Euskara",
    country: "Spain",
    region: "Basque Country",
    type: "international",
    supportStatus: "available",
    speechCode: "eu-ES",
    popular: false
  },
  {
    code: "rm",
    name: "Romansh",
    nativeName: "Rumantsch",
    country: "Switzerland",
    region: "Grisons",
    type: "international",
    supportStatus: "limited",
    speechCode: "de-CH",
    popular: false
  },
  {
    code: "mi",
    name: "M\u0101ori",
    nativeName: "Te Reo M\u0101ori",
    country: "New Zealand",
    region: "Oceania",
    type: "international",
    supportStatus: "available",
    speechCode: "mi-NZ",
    popular: false
  }
];

// backend/src/middleware/validate.ts
var validLanguageCodes = /* @__PURE__ */ new Set();
try {
  languages_default.forEach((l) => {
    if (l && l.code) validLanguageCodes.add(l.code.toLowerCase());
  });
} catch {
  ["en", "hi", "kn", "te", "ta", "mr", "ml", "gu", "bn", "pa", "es", "fr", "de"].forEach((c) => validLanguageCodes.add(c));
}
function validateChatInput(req, res, next) {
  const { message, image, language } = req.body;
  if ((!message || typeof message !== "string" || message.trim().length === 0) && !image) {
    return res.status(400).json({
      success: false,
      error: "Please enter a farming question or take/upload a crop photo."
    });
  }
  if (message && typeof message === "string" && message.length > 3e3) {
    return res.status(400).json({
      success: false,
      error: "Message is too long. Please keep your question under 3000 characters."
    });
  }
  if (language && language.code) {
    const code = String(language.code).toLowerCase();
    if (!validLanguageCodes.has(code) && code !== "en") {
      req.body.language.code = code;
    }
  }
  if (typeof message === "string") {
    req.body.message = message.trim();
  }
  next();
}

// backend/src/routes/chatRoutes.ts
var router = Router();
router.post("/", authenticate, chatRateLimiter, validateChatInput, handleChatMessage);
router.post("/transcribe", authenticate, handleAudioTranscribe);
var chatRoutes_default = router;

// backend/src/routes/conversationRoutes.ts
import { Router as Router2 } from "express";

// backend/src/controllers/conversationController.ts
import crypto2 from "crypto";
async function getConversations(req, res) {
  try {
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient.from("conversations").select("id, title, preferred_language, created_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
      if (error) {
        logger.error("Error fetching Supabase conversations:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, conversations: data || [] });
    }
    const convs = demoStore.getConversations(userId).map((c) => ({
      id: c.id,
      title: c.title,
      preferred_language: c.preferred_language,
      created_at: c.created_at,
      updated_at: c.updated_at
    }));
    return res.status(200).json({ success: true, conversations: convs });
  } catch (err) {
    logger.error("getConversations error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function getConversationById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient.from("conversations").select("*").eq("id", id).eq("user_id", userId).single();
      if (error || !data) {
        return res.status(404).json({ success: false, error: "Conversation not found." });
      }
      return res.status(200).json({ success: true, conversation: data });
    }
    const conv = demoStore.getConversation(id, userId);
    if (!conv) {
      return res.status(404).json({ success: false, error: "Conversation not found." });
    }
    return res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    logger.error("getConversationById error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function createConversation(req, res) {
  try {
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    const { title = "New Farming Chat", preferred_language = "en", messages = [] } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient.from("conversations").insert({
        user_id: userId,
        title,
        preferred_language,
        messages,
        created_at: now,
        updated_at: now
      }).select().single();
      if (error) {
        logger.error("Error creating Supabase conversation:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(201).json({ success: true, conversation: data });
    }
    const newId = crypto2.randomUUID();
    const newConv = {
      id: newId,
      user_id: userId,
      title,
      preferred_language,
      messages,
      created_at: now,
      updated_at: now
    };
    demoStore.saveConversation(newConv);
    return res.status(201).json({ success: true, conversation: newConv });
  } catch (err) {
    logger.error("createConversation error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function updateConversation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    const { title, messages, preferred_language } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const updates = { updated_at: now };
      if (title !== void 0) updates.title = title;
      if (messages !== void 0) updates.messages = messages;
      if (preferred_language !== void 0) updates.preferred_language = preferred_language;
      const { data, error } = await req.supabaseUserClient.from("conversations").update(updates).eq("id", id).eq("user_id", userId).select().single();
      if (error) {
        logger.error("Error updating Supabase conversation:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, conversation: data });
    }
    const existing = demoStore.getConversation(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Conversation not found." });
    }
    if (title !== void 0) existing.title = title;
    if (messages !== void 0) existing.messages = messages;
    if (preferred_language !== void 0) existing.preferred_language = preferred_language;
    existing.updated_at = now;
    demoStore.saveConversation(existing);
    return res.status(200).json({ success: true, conversation: existing });
  } catch (err) {
    logger.error("updateConversation error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { error } = await req.supabaseUserClient.from("conversations").delete().eq("id", id).eq("user_id", userId);
      if (error) {
        logger.error("Error deleting Supabase conversation:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, message: "Conversation deleted successfully." });
    }
    const deleted = demoStore.deleteConversation(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Conversation not found or already deleted." });
    }
    return res.status(200).json({ success: true, message: "Conversation deleted successfully." });
  } catch (err) {
    logger.error("deleteConversation error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// backend/src/routes/conversationRoutes.ts
var router2 = Router2();
router2.use(authenticate);
router2.get("/", getConversations);
router2.get("/:id", getConversationById);
router2.post("/", createConversation);
router2.put("/:id", updateConversation);
router2.delete("/:id", deleteConversation);
var conversationRoutes_default = router2;

// backend/src/routes/profileRoutes.ts
import { Router as Router3 } from "express";

// backend/src/controllers/profileController.ts
async function getProfile(req, res) {
  try {
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient.from("profiles").select("*").eq("id", userId).single();
      if (error && error.code !== "PGRST116") {
        logger.error("Error fetching Supabase profile:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      if (data) {
        return res.status(200).json({ success: true, profile: data });
      }
    }
    const profile = demoStore.getProfile(userId);
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    logger.error("getProfile error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function updateProfile(req, res) {
  try {
    const userId = req.user?.id || "guest-farmer";
    const isGuest = req.user?.isGuest;
    const { full_name, preferred_language, country_code, region } = req.body;
    const updates = {};
    if (full_name !== void 0) updates.full_name = full_name;
    if (preferred_language !== void 0) updates.preferred_language = preferred_language;
    if (country_code !== void 0) updates.country_code = country_code;
    if (region !== void 0) updates.region = region;
    if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
      const { data, error } = await req.supabaseUserClient.from("profiles").upsert({ id: userId, ...updates }).select().single();
      if (error) {
        logger.error("Error updating Supabase profile:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, profile: data });
    }
    const updatedProfile = demoStore.saveProfile(userId, updates);
    return res.status(200).json({ success: true, profile: updatedProfile });
  } catch (err) {
    logger.error("updateProfile error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// backend/src/routes/profileRoutes.ts
var router3 = Router3();
router3.use(authenticate);
router3.get("/", getProfile);
router3.put("/", updateProfile);
var profileRoutes_default = router3;

// backend/src/routes/healthRoutes.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/", (req, res) => {
  const geminiReady = Boolean(config.gemini.apiKey && config.gemini.apiKey !== "your_gemini_api_key");
  const supabaseReady = isSupabaseConfigured();
  res.status(200).json({
    status: "ok",
    service: "GreenGrow AI Agriculture Backend",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ai: {
      provider: "Google Gemini",
      model: config.gemini.model,
      configured: geminiReady
    },
    database: {
      provider: "Supabase",
      configured: supabaseReady
    },
    environment: config.nodeEnv
  });
});
var healthRoutes_default = router4;

// backend/src/routes/ttsRoutes.ts
import { Router as Router5 } from "express";

// backend/src/services/ttsService.ts
function detectLanguageFromScript(text, fallback = "en") {
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  if (/[\u0B00-\u0B7F]/.test(text)) return "or";
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return fallback;
}
function cleanTextForSpeech(text) {
  return text.replace(/[*#_~`>]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/\n\s*[-*]\s*/g, ". ").replace(/\n\s*\d+\.\s*/g, ". ").replace(/\n+/g, ". ").replace(/\s+/g, " ").trim();
}
function chunkText(text, maxLen = 140) {
  const sentences = text.match(/[^.!?।]+[.!?।]?/g) || [text];
  const chunks = [];
  let current = "";
  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + " " + trimmed).trim().length <= maxLen) {
      current = (current + " " + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
        const words = trimmed.split(" ");
        let wordChunk = "";
        for (const w of words) {
          if ((wordChunk + " " + w).trim().length <= maxLen) {
            wordChunk = (wordChunk + " " + w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        current = wordChunk;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 8);
}
async function synthesizeNativeSpeech(text, requestedLang) {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    throw new Error("No text to synthesize.");
  }
  let lang = requestedLang ? requestedLang.split("-")[0].toLowerCase() : "en";
  lang = detectLanguageFromScript(cleaned, lang);
  const chunks = chunkText(cleaned, 150).slice(0, 6);
  logger.info(`Synthesizing native audio in language [${lang}] for ${chunks.length} chunks in parallel...`);
  const fetchChunk = async (chunk) => {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      } else {
        logger.warn(`TTS chunk response status: ${res.status}`);
      }
    } catch (err) {
      logger.warn(`TTS chunk fetch failed for lang [${lang}]:`, err.message);
    }
    return null;
  };
  const results = await Promise.all(chunks.map((c) => fetchChunk(c)));
  const audioBuffers = results.filter((b) => b !== null && b.length > 0);
  if (audioBuffers.length === 0) {
    throw new Error(`Could not synthesize speech audio for language: ${lang}`);
  }
  return Buffer.concat(audioBuffers);
}

// backend/src/routes/ttsRoutes.ts
var router5 = Router5();
router5.get("/", async (req, res) => {
  try {
    const text = req.query.text;
    const lang = req.query.lang;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Text query parameter is required." });
    }
    const audioBuffer = await synthesizeNativeSpeech(text, lang);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.end(audioBuffer);
  } catch (error) {
    logger.error("TTS Route Error:", error.message || error);
    return res.status(500).json({ success: false, error: error.message || "TTS synthesis failed." });
  }
});
var ttsRoutes_default = router5;

// backend/src/app.ts
process.on("uncaughtException", (err) => {
  console.error("CRITICAL UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("CRITICAL UNHANDLED REJECTION:", reason);
});
var app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        config.frontendUrl,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
      ];
      if (allowedOrigins.includes(origin) || config.nodeEnv === "development") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-guest-user-id"]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});
app.use(["/api/health", "/health"], healthRoutes_default);
app.use(["/api/chat", "/chat"], chatRoutes_default);
app.use(["/api/conversations", "/conversations"], conversationRoutes_default);
app.use(["/api/profile", "/profile"], profileRoutes_default);
app.use(["/api/tts", "/tts"], ttsRoutes_default);
app.get(["/", "/api"], (_req, res) => {
  res.json({
    message: "GreenGrow AI Agriculture API is running.",
    healthCheck: "/api/health"
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`
  });
});
app.use((err, _req, res, _next) => {
  logger.error("Unhandled Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error"
  });
});
var app_default = app;
export {
  app,
  app_default as default
};
