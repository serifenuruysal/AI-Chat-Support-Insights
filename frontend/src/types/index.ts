export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  ai_provider?: string;
  latency_ms?: number;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  first_message?: string;
  message_count: number;
}

export interface SentimentBreakdown {
  sentiment: 'positive' | 'neutral' | 'negative';
  count: number;
}

export interface TopicSummary {
  topic: string;
  count: number;
  sentiment_avg: number;
}

export interface DailyVolume {
  date: string;
  count: number;
  avg_sentiment: number;
}

export interface AnalyticsOverview {
  total: number;
  complaints: number;
  feature_requests: number;
  avg_sentiment: number;
  avg_latency_ms: number;
  active_users: number;
  returning_users: number;
  sentiment_breakdown: SentimentBreakdown[];
  by_intent: { intent: string; count: number }[];
  top_topics: TopicSummary[];
  daily_volume: DailyVolume[];
  recent_complaints: {
    id: string;
    user_id: string;
    sentiment: string;
    topics: string;
    content: string;
    analyzed_at: string;
  }[];
  peak_hours: { hour: number; count: number }[];
}
