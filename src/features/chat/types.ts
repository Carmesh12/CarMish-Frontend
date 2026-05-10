import type { Vehicle } from '../vehicles/types';

export type ChatSenderType = 'USER' | 'BOT';

export type ChatMessage = {
  id: string;
  sessionId: string;
  senderType: ChatSenderType;
  message: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
};

export type VehicleFilters = {
  listingType: 'SALE' | 'RENT' | 'BOTH' | null;
  brand: string | null;
  model: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  city: string | null;
  minYear: number | null;
  maxYear: number | null;
};

export type SendMessageResponse = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  reply: string;
  filters: VehicleFilters;
  recommendations: Vehicle[];
};

