export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REQUEST_RESET: '/auth/request-reset-password', // a DESARROLLAR
    RESET_PASSWORD: '/auth/reset-password', // a DESARROLLAR
    REFRESH_TOKEN: '/auth/refresh-token'  ,
    LOGOUT: '/auth/logout',
  },
  
  // Categories
  CATEGORIES: {
    GET_ALL: '/categories',
    CREATE: '/categories',
    MODIFY: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`
  },
  
  // Catalogs
  CATALOGS: {
    GET_ALL: '/catalogs',
    CREATE: '/catalogs',
    MODIFY: (id: string) => `/catalogs/${id}`,
    DELETE: (id: string) => `/catalogs/${id}`
  },
  
  // Catalog Items
  CATALOG_ITEMS: {
    GET_ALL: (catalogId: string) => `/catalogs/${catalogId}/items`,
    CREATE: (catalogId: string) => `/catalogs/${catalogId}/items`,
    MODIFY: (catalogId: string, catalogItemId: string) => `/catalogs/${catalogId}/items/${catalogItemId}`,
    DELETE: (catalogId: string, catalogItemId: string) => `/catalogs/${catalogId}/items/${catalogItemId}`,
  },
  
  // Companies
  COMPANIES: { // A DESARROLLAR
    BY_ID: (id: string) => `/companies/${id}`,
    LOGO: (id: string) => `/companies/${id}/logo`,
    BY_SLUG: (slug: string) => `/companies/slug/${slug}`
  },
  
  // Products
  PRODUCTS: { // A DESARROLLAR
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    AVAILABILITY: (id: string) => `/products/${id}/availability`,
    BY_CATEGORY: (categoryId: string) => `/products/category/${categoryId}`,
    SEARCH: '/products/search',
    BULK_UPLOAD: '/products/bulk-upload'
  },
} as const;
