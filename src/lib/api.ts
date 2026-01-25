// API utilities for connecting to Vercel serverless functions

export const API_BASE = import.meta.env.PROD 
  ? '' // In production (and Vercel previews), API routes are at the same domain
  : 'http://localhost:3000'; // Local development with vercel dev

// Auth API
export const authApi = {
  async guestSession() {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guest' }),
    });
    return response.json();
  },

  async register(data: { email: string; password: string; name?: string; phone?: string }) {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...data }),
    });
    return response.json();
  },

  async login(data: { email: string; password: string }) {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', ...data }),
    });
    return response.json();
  },

  async convertGuestToUser(data: { guestId: string; email: string; password: string; name?: string; phone?: string }) {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert', ...data }),
    });
    return response.json();
  },

  async googleLogin(credential: string) {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google', credential }),
    });
    return response.json();
  },
};

// Orders API
export const ordersApi = {
  async getByGuestId(guestId: string) {
    const response = await fetch(`${API_BASE}/api/orders?guestId=${encodeURIComponent(guestId)}`);
    return response.json();
  },

  async getByEmail(email: string) {
    const response = await fetch(`${API_BASE}/api/orders?email=${encodeURIComponent(email)}`);
    return response.json();
  },

  async getBySessionId(sessionId: string) {
    const response = await fetch(`${API_BASE}/api/orders?sessionId=${encodeURIComponent(sessionId)}`);
    return response.json();
  },

  async getById(orderId: string) {
    const response = await fetch(`${API_BASE}/api/orders?orderId=${encodeURIComponent(orderId)}`);
    return response.json();
  },

  async updateStatus(orderId: string, status: string) {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    return response.json();
  },
};

// Stripe API
export const stripeApi = {
  async createCheckoutSession(data: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
      meatType?: string;
      sauce?: string;
    }>;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    guestId?: string;
  }) {
    const response = await fetch(`${API_BASE}/api/stripe-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
