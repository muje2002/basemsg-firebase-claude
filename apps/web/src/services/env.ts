// Isolated module for Vite environment variables.
// This file uses import.meta.env (Vite-specific) and is mocked in Jest tests.
export const BASE_URL: string = import.meta.env.VITE_API_URL || '/api';
