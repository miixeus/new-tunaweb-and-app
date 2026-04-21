export const APP_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5174'
    : 'https://app.tunaweb.com.br';