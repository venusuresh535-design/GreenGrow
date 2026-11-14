import { logger } from '../utils/logger.js';
// Auto-detect native script from text
export function detectLanguageFromScript(text, fallback = 'en') {
    if (/[\u0C80-\u0CFF]/.test(text))
        return 'kn'; // Kannada
    if (/[\u0900-\u097F]/.test(text))
        return 'hi'; // Hindi / Marathi
    if (/[\u0C00-\u0C7F]/.test(text))
        return 'te'; // Telugu
    if (/[\u0B80-\u0BFF]/.test(text))
        return 'ta'; // Tamil
    if (/[\u0D00-\u0D7F]/.test(text))
        return 'ml'; // Malayalam
    if (/[\u0980-\u09FF]/.test(text))
        return 'bn'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(text))
        return 'gu'; // Gujarati
    if (/[\u0A00-\u0A7F]/.test(text))
        return 'pa'; // Punjabi
    if (/[\u0B00-\u0B7F]/.test(text))
        return 'or'; // Odia
    if (/[\u0600-\u06FF]/.test(text))
        return 'ur'; // Urdu / Arabic
    if (/[\u4E00-\u9FFF]/.test(text))
        return 'zh'; // Chinese
    if (/[\u3040-\u30FF]/.test(text))
        return 'ja'; // Japanese
    if (/[\uAC00-\uD7AF]/.test(text))
        return 'ko'; // Korean
    if (/[\u0E00-\u0E7F]/.test(text))
        return 'th'; // Thai
    if (/[\u0400-\u04FF]/.test(text))
        return 'ru'; // Russian
    return fallback;
}
// Clean text for speech synthesis
export function cleanTextForSpeech(text) {
    return text
        .replace(/[*#_~`>]/g, '') // remove markdown symbols
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
        .replace(/\n\s*[-*]\s*/g, '. ') // bullet points to pauses
        .replace(/\n\s*\d+\.\s*/g, '. ') // numbers to pauses
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
}
// Split text into chunks under 150 chars (preserving whole words and sentences)
export function chunkText(text, maxLen = 140) {
    const sentences = text.match(/[^.!?।]+[.!?।]?/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
        const trimmed = s.trim();
        if (!trimmed)
            continue;
        if ((current + ' ' + trimmed).trim().length <= maxLen) {
            current = (current + ' ' + trimmed).trim();
        }
        else {
            if (current)
                chunks.push(current);
            if (trimmed.length > maxLen) {
                // Split long sentence by commas or words
                const words = trimmed.split(' ');
                let wordChunk = '';
                for (const w of words) {
                    if ((wordChunk + ' ' + w).trim().length <= maxLen) {
                        wordChunk = (wordChunk + ' ' + w).trim();
                    }
                    else {
                        if (wordChunk)
                            chunks.push(wordChunk);
                        wordChunk = w;
                    }
                }
                current = wordChunk;
            }
            else {
                current = trimmed;
            }
        }
    }
    if (current)
        chunks.push(current);
    return chunks.slice(0, 8); // limit to first 8 chunks to keep audio responsive
}
export async function synthesizeNativeSpeech(text, requestedLang) {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) {
        throw new Error('No text to synthesize.');
    }
    // Detect script or use requested language (strip region code like "kn-IN" -> "kn")
    let lang = requestedLang ? requestedLang.split('-')[0].toLowerCase() : 'en';
    lang = detectLanguageFromScript(cleaned, lang);
    const chunks = chunkText(cleaned, 150).slice(0, 6);
    logger.info(`Synthesizing native audio in language [${lang}] for ${chunks.length} chunks in parallel...`);
    const fetchChunk = async (chunk) => {
        const encoded = encodeURIComponent(chunk);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    Referer: 'https://translate.google.com/',
                },
            });
            if (res.ok) {
                const ab = await res.arrayBuffer();
                return Buffer.from(ab);
            }
            else {
                logger.warn(`TTS chunk response status: ${res.status}`);
            }
        }
        catch (err) {
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
