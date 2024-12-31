const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const gameService = {
  async getGame(id: string) {
    const response = await fetch(`${API_URL}/games/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch game');
    return response.json();
  },

  async getCurrentUser() {
    const response = await fetch(`${API_URL}/current-user/`);
    if (!response.ok) throw new Error('Failed to fetch current user');
    return response.json();
  },

  async startGame(id: string) {
    const response = await fetch(`${API_URL}/games/${id}/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start game');
    }
    
    return response.json();
  },
}; 