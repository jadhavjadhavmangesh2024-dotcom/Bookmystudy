// ============================================================
// API SERVICE - Centralized API calls
// ============================================================

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('abhyasika_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(method: string, path: string, body?: any, params?: Record<string, any>): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const api = {
  auth: {
    register: (d: any) => request('POST', '/auth/register', d),
    login: (d: any) => request('POST', '/auth/login', d),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
    sendOtp: (d: any) => request('POST', '/auth/send-otp', d),
    verifyOtp: (d: any) => request('POST', '/auth/verify-otp', d),
    forgotPassword: (d: any) => request('POST', '/auth/forgot-password', d),
    resetPassword: (d: any) => request('POST', '/auth/reset-password', d),
  },

  abhyasikas: {
    list: (p?: any) => request('GET', '/abhyasikas', undefined, p),
    nearby: (p: any) => request('GET', '/abhyasikas/nearby', undefined, p),
    featured: () => request('GET', '/abhyasikas/featured'),
    get: (id: string | number) => request('GET', `/abhyasikas/${id}`),
    create: (d: any) => request('POST', '/abhyasikas', d),
    update: (id: any, d: any) => request('PUT', `/abhyasikas/${id}`, d),
    addPhotos: (id: any, d: any) => request('POST', `/abhyasikas/${id}/photos`, d),
    deletePhoto: (id: any, photoId: any) => request('DELETE', `/abhyasikas/${id}/photos/${photoId}`),
    updateFacilities: (id: any, d: any) => request('PUT', `/abhyasikas/${id}/facilities`, d),
    getAnalytics: (id: any) => request('GET', `/abhyasikas/${id}/analytics`),
    myListings: () => request('GET', '/abhyasikas/owner/my-listings'),
  },

  seats: {
    list: (abhyasikaId: any, p?: any) => request('GET', `/seats/abhyasika/${abhyasikaId}`, undefined, p),
    availability: (seatId: any, p?: any) => request('GET', `/seats/availability/${seatId}`, undefined, p),
    create: (d: any) => request('POST', '/seats', d),
    bulkCreate: (d: any) => request('POST', '/seats/bulk', d),
    update: (id: any, d: any) => request('PUT', `/seats/${id}`, d),
    delete: (id: any) => request('DELETE', `/seats/${id}`),
    floorPlans: (abhyasikaId: any) => request('GET', `/seats/floor-plans/${abhyasikaId}`),
    createFloorPlan: (d: any) => request('POST', '/seats/floor-plans', d),
    categories: (abhyasikaId: any) => request('GET', `/seats/categories/${abhyasikaId}`),
    createCategory: (d: any) => request('POST', '/seats/categories', d),
    updateCategory: (id: any, d: any) => request('PUT', `/seats/categories/${id}`, d),
  },

  bookings: {
    list: (p?: any) => request('GET', '/bookings', undefined, p),
    get: (id: any) => request('GET', `/bookings/${id}`),
    create: (d: any) => request('POST', '/bookings', d),
    confirm: (id: any, d: any) => request('POST', `/bookings/${id}/confirm`, d),
    cancel: (id: any, d: any) => request('POST', `/bookings/${id}/cancel`, d),
    ownerAll: (p?: any) => request('GET', '/bookings/owner/all', undefined, p),
    checkIn: (id: any) => request('POST', `/bookings/${id}/checkin`),
    checkOut: (id: any) => request('POST', `/bookings/${id}/checkout`),
  },

  payments: {
    createOrder: (d: any) => request('POST', '/payments/create-order', d),
    verify: (d: any) => request('POST', '/payments/verify', d),
    history: () => request('GET', '/payments/history'),
    refund: (d: any) => request('POST', '/payments/refund', d),
  },

  admin: {
    dashboard: () => request('GET', '/admin/dashboard'),
    abhyasikas: (p?: any) => request('GET', '/admin/abhyasikas', undefined, p),
    approve: (id: any, d?: any) => request('POST', `/admin/abhyasikas/${id}/approve`, d || {}),
    reject: (id: any, d: any) => request('POST', `/admin/abhyasikas/${id}/reject`, d),
    users: (p?: any) => request('GET', '/admin/users', undefined, p),
    updateUserStatus: (id: any, d: any) => request('PUT', `/admin/users/${id}/status`, d),
    revenueAnalytics: (p?: any) => request('GET', '/admin/analytics/revenue', undefined, p),
    userAnalytics: () => request('GET', '/admin/analytics/users'),
    commission: () => request('GET', '/admin/commission'),
    setCommission: (d: any) => request('POST', '/admin/commission', d),
    settings: () => request('GET', '/admin/settings'),
    updateSettings: (d: any) => request('PUT', '/admin/settings', d),
    ads: () => request('GET', '/admin/advertisements'),
    createAd: (d: any) => request('POST', '/admin/advertisements', d),
    payouts: () => request('GET', '/admin/payouts'),
    tickets: (p?: any) => request('GET', '/admin/support-tickets', undefined, p),
    broadcast: (d: any) => request('POST', '/admin/broadcast-notification', d),
  },

  reviews: {
    list: (abhyasikaId: any, p?: any) => request('GET', `/reviews/abhyasika/${abhyasikaId}`, undefined, p),
    create: (d: any) => request('POST', '/reviews', d),
  },

  notifications: {
    list: (p?: any) => request('GET', '/notifications', undefined, p),
    markRead: (d?: any) => request('PUT', '/notifications/read', d || {}),
  },

  users: {
    profile: () => request('GET', '/users/profile'),
    updateProfile: (d: any) => request('PUT', '/users/profile', d),
  },

  wishlists: {
    list: () => request('GET', '/wishlists'),
    toggle: (d: any) => request('POST', '/wishlists', d),
  },

  coupons: {
    validate: (d: any) => request('POST', '/coupons/validate', d),
  },

  cities: {
    list: () => request('GET', '/cities'),
    localities: (id: any) => request('GET', `/cities/${id}/localities`),
  },

  facilities: {
    list: () => request('GET', '/facilities'),
  },

  settings: {
    public: () => request('GET', '/settings/public'),
  },

  faqs: {
    list: (role?: string) => request('GET', '/faqs', undefined, { role }),
  },

  support: {
    create: (d: any) => request('POST', '/support', d),
    list: () => request('GET', '/support'),
  },

  stats: {
    platform: () => request('GET', '/stats'),
  }
};

export default api;
