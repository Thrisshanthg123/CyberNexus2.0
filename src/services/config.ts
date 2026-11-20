export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://127.0.0.1:5000";
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== undefined 
  ? import.meta.env.VITE_USE_MOCK === "true" 
  : true;
