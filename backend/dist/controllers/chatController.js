import { generateAgricultureResponse, transcribeAudioWithGemini } from '../services/geminiService.js';
import { isSupabaseConfigured, demoStore } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
export async function handleChatMessage(req, res) {
    try {
        const { message = '', image, imageMimeType, history = [], language = { code: 'en', name: 'English' }, country, region, conversationId: clientConversationId, } = req.body;
        if ((!message || !message.trim()) && !image) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a farming question or take/upload a crop photo.',
            });
        }
        const userId = req.user?.id || 'guest-farmer';
        const isGuest = req.user?.isGuest;
        logger.info(`Chat request received from user: ${userId} (${isGuest ? 'guest' : 'authenticated'})${image ? ' [with crop photo]' : ''}`);
        // Call Gemini API using the official SDK
        const assistantReply = await generateAgricultureResponse({
            message,
            image,
            imageMimeType,
            history,
            language,
            country,
            region,
        });
        const now = new Date().toISOString();
        const userMsgObj = {
            role: 'user',
            content: message?.trim() || '🌱 Plant / Crop Image Analysis',
            timestamp: now,
        };
        if (image) {
            userMsgObj.image = image;
            userMsgObj.imageMimeType = imageMimeType || 'image/jpeg';
        }
        const assistantMsgObj = {
            role: 'assistant',
            content: assistantReply,
            timestamp: new Date().toISOString(),
        };
        let activeConvId = clientConversationId;
        const defaultTitle = image ? '🌱 Plant Photo Diagnosis' : 'Farming Consultation';
        const cleanTitle = message && message.trim().length > 0
            ? (message.length > 40 ? `${message.substring(0, 40)}...` : message)
            : defaultTitle;
        // Save or update conversation
        if (!isGuest && req.supabaseUserClient && isSupabaseConfigured()) {
            try {
                const client = req.supabaseUserClient;
                if (activeConvId) {
                    // Fetch existing conversation messages
                    const { data: existing } = await client
                        .from('conversations')
                        .select('messages, title')
                        .eq('id', activeConvId)
                        .single();
                    const updatedMessages = existing?.messages ? [...existing.messages, userMsgObj, assistantMsgObj] : [userMsgObj, assistantMsgObj];
                    await client
                        .from('conversations')
                        .update({
                        messages: updatedMessages,
                        updated_at: now,
                    })
                        .eq('id', activeConvId);
                }
                else {
                    // Generate title based on first user message
                    const { data: newConv, error: insertError } = await client
                        .from('conversations')
                        .insert({
                        user_id: userId,
                        title: cleanTitle,
                        preferred_language: language.code || 'en',
                        messages: [userMsgObj, assistantMsgObj],
                        created_at: now,
                        updated_at: now,
                    })
                        .select('id')
                        .single();
                    if (!insertError && newConv) {
                        activeConvId = newConv.id;
                    }
                }
            }
            catch (dbErr) {
                logger.warn('Error persisting conversation to Supabase:', dbErr.message);
            }
        }
        else {
            // In-memory demo store
            if (!activeConvId) {
                activeConvId = crypto.randomUUID();
                demoStore.saveConversation({
                    id: activeConvId,
                    user_id: userId,
                    title: cleanTitle,
                    preferred_language: language.code || 'en',
                    messages: [userMsgObj, assistantMsgObj],
                    created_at: now,
                    updated_at: now,
                });
            }
            else {
                const existing = demoStore.getConversation(activeConvId, userId);
                const updatedMessages = existing ? [...existing.messages, userMsgObj, assistantMsgObj] : [userMsgObj, assistantMsgObj];
                demoStore.saveConversation({
                    id: activeConvId,
                    user_id: userId,
                    title: existing?.title || cleanTitle,
                    preferred_language: language.code || 'en',
                    messages: updatedMessages,
                    created_at: existing?.created_at || now,
                    updated_at: now,
                });
            }
        }
        return res.status(200).json({
            success: true,
            response: assistantReply,
            conversationId: activeConvId,
            message: assistantMsgObj,
        });
    }
    catch (error) {
        logger.error('Error handling chat message:', error.message || error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while generating the agriculture guidance.',
        });
    }
}
export async function handleAudioTranscribe(req, res) {
    try {
        const { audio, mimeType = 'audio/webm', language = { code: 'en', name: 'English' } } = req.body;
        if (!audio || typeof audio !== 'string') {
            return res.status(400).json({ success: false, error: 'Audio base64 data is required.' });
        }
        // Clean data URL prefix if present (e.g. data:audio/webm;base64,...)
        const cleanBase64 = audio.includes(',') ? audio.split(',')[1] : audio;
        const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
        logger.info(`Received voice audio for transcription: mimeType=${cleanMime}, size=${cleanBase64.length} chars, language=${language.name}`);
        const transcript = await transcribeAudioWithGemini({
            audioBase64: cleanBase64,
            mimeType: cleanMime,
            language,
        });
        return res.status(200).json({
            success: true,
            transcript,
        });
    }
    catch (error) {
        logger.error('Error during audio transcription:', error.message || error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Audio transcription failed. Please try typing your question.',
        });
    }
}
