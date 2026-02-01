export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REQUEST_RESET: '/auth/request-reset',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me'
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ROLE: (id: string) => `/users/${id}/role`
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    AVAILABILITY: (id: string) => `/products/${id}/availability`,
    BY_CATEGORY: (categoryId: string) => `/products/category/${categoryId}`,
    SEARCH: '/products/search',
    BULK_UPLOAD: '/products/bulk-upload'
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    PRODUCTS: (id: string) => `/categories/${id}/products`
  },
  
  // Catalogs
  CATALOGS: {
    BASE: '/catalogs',
    BY_ID: (id: string) => `/catalogs/${id}`,
    ACTIVATE: (id: string) => `/catalogs/${id}/activate`,
    ACTIVE: '/catalogs/active'
  },
  
  // Catalog Items
  CATALOG_ITEMS: {
    BASE: '/catalog-items',
    BY_CATALOG: (catalogId: string) => `/catalog-items/catalog/${catalogId}`,
    BY_ID: (id: string) => `/catalog-items/${id}`,
    REORDER: (id: string) => `/catalog-items/${id}/reorder`,
    BULK_ADD: '/catalog-items/bulk-add'
  },
  
  // Companies
  COMPANIES: {
    BY_ID: (id: string) => `/companies/${id}`,
    LOGO: (id: string) => `/companies/${id}/logo`,
    BY_SLUG: (slug: string) => `/companies/slug/${slug}`
  }
} as const;
