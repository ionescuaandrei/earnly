export interface User {
  email: string;
  name: string;
  photoURL?: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  country?: string;
  joinedAt: Date;
  updatedAt: Date;
  flags: {
    banned: boolean;
    locked: boolean;
    verified: boolean;
  };
  profile?: {
    age?: number;
    gender?: string;
    interests?: string[];
  };
}

export interface TaskEvent {
  uid: string;
  source: 'bitlabs' | 'survey' | 'bonus' | 'referral';
  providerTxId: string;
  credits: number;
  status: 'pending' | 'completed' | 'failed';
  raw: Record<string, any>;
  processedAt: Date;
}

export interface EarningEntry {
  id: string;
  source: string;
  txId: string;
  credits: number;
  surveyName?: string;
  completionTime?: number;
  at: any; // Firestore timestamp
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  provider: string;
  price: number;
  value: number;
  currency: string;
  region: string[];
  category: 'giftcard' | 'paypal' | 'crypto' | 'cashout';
  active: boolean;
  stock: number;
  image: string;
  terms: string;
  estimatedDelivery: 'instant' | '1-24h' | '1-3days';
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCode {
  code: string;
  status: 'free' | 'reserved' | 'used';
  reservedBy?: string;
  reservedAt?: Date;
  usedBy?: string;
  usedAt?: Date;
  batch: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Redemption {
  id: string;
  rewardId: string;
  title: string;
  price: number;
  code: string;
  status: 'pending' | 'delivered' | 'failed' | 'refunded';
  deliveredAt?: Date;
  redeemedAt: Date;
  instructions: string;
  expiresAt?: Date;
}

export interface Notification {
  id: string;
  type: 'earning' | 'redemption' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}
