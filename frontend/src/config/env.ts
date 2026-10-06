export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== undefined 
  ? import.meta.env.VITE_USE_MOCK === 'true' 
  : import.meta.env.DEV;
