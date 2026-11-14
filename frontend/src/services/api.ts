import { Language, ChatMessage, Conversation, UserProfile } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:5001/api');

// Helper to get auth header or guest ID
function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Check localStorage for guest user id
    let guestId = localStorage.getItem('greengrow_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('greengrow_guest_id', guestId);
    }
    headers['x-guest-user-id'] = guestId;
  }

  return headers;
}

export interface SendMessageParams {
  message: string;
  image?: string;
  imageMimeType?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  language?: Language;
  country?: string;
  region?: string;
  conversationId?: string;
  token?: string | null;
}

export interface SendMessageResponse {
  success: boolean;
  response: string;
  conversationId: string;
  message: ChatMessage;
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<{ status: string; ai?: any; database?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (err: any) {
      console.warn('Backend health check error:', err.message);
      return { status: 'offline' };
    }
  },

  // Send message to Gemini AI
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    const { token, ...bodyData } = params;
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to get response from GreenGrow AI.');
    }

    return data;
  },

  // Transcribe voice audio recording using backend Gemini
  async transcribeAudio(
    audioBase64: string,
    mimeType: string,
    language?: Language,
    token?: string | null
  ): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/chat/transcribe`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        audio: audioBase64,
        mimeType,
        language,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Voice transcription failed.');
    }

    return data.transcript || '';
  },

  // Fetch all conversations
  async getConversations(token?: string | null): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch conversations.');
    }

    return data.conversations || [];
  },

  // Fetch single conversation
  async getConversation(id: string, token?: string | null): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch conversation.');
    }

    return data.conversation;
  },

  // Create conversation
  async createConversation(
    data: { title?: string; preferred_language?: string; messages?: ChatMessage[] },
    token?: string | null
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      throw new Error(resData.error || 'Failed to create conversation.');
    }

    return resData.conversation;
  },

  // Update conversation
  async updateConversation(
    id: string,
    updates: { title?: string; messages?: ChatMessage[]; preferred_language?: string },
    token?: string | null
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update conversation.');
    }

    return data.conversation;
  },

  // Delete conversation
  async deleteConversation(id: string, token?: string | null): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete conversation.');
    }

    return true;
  },

  // Get user profile
  async getProfile(token?: string | null): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getHeaders(token),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch profile.');
    }

    return data.profile;
  },

  // Update profile
  async updateProfile(updates: Partial<UserProfile>, token?: string | null): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    return data.profile;
  },
};
