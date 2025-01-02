export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'development' 
    ? 'http://127.0.0.1:8000/api'
    : 'https://awm1.uksouth.cloudapp.azure.com/api'
); 