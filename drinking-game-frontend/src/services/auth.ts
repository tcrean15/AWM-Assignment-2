import { API_BASE_URL } from '../config';

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    // ... rest of the code
  });
  // ... rest of the code
}; 