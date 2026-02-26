export const APP_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    RESET_PASSWORD: '/auth/reset-password'
  },
  
  // Main
  DASHBOARD: '/dashboard',
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    NEW: '/products/new',
    EDIT: (id: string) => `/products/${id}/edit`,
    DETAIL: (id: string) => `/products/${id}`
  },
  
  // Catalogs
  CATALOGS: {
    LIST: '/catalogs',
    NEW: '/catalogs/new',
    EDIT: (id: string) => `/catalogs/${id}/edit`,
    BUILDER: (id: string) => `/catalogs/${id}/builder`
  },
  
  // Company
  COMPANY: {
    SETTINGS: '/company/settings'
  }
} as const;
