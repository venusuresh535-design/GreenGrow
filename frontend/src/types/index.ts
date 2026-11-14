export interface Language {
  code: string;
  name: string;
  nativeName: string;
  country: string;
  region: string;
  type: 'regional' | 'international';
  supportStatus: 'available' | 'limited';
  speechCode: string;
  popular?: boolean;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
  imageMimeType?: string;
}

export interface Conversation {
  id: string;
  user_id?: string;
  title: string;
  preferred_language: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  preferred_language: string;
  country_code?: string;
  region?: string;
  created_at?: string;
}

export interface AgricultureCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  questions: string[];
}
