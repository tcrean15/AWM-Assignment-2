import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://awm1.uksouth.cloudapp.azure.com/api'  // Production URL
    : 'http://localhost:8000/api';  // Development URL

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,  // Increase timeout for production
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add auth token to requests
axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Add retry logic
axiosInstance.interceptors.response.use(undefined, async (error) => {
    if (error.code === 'ERR_NETWORK') {
        console.error('Network error - server might be down');
        // You could add retry logic here if needed
    }
    return Promise.reject(error);
});

export class ApiService {
    static async login(username: string, password: string) {
        try {
            const response = await axiosInstance.post('/login/', {
                username,
                password
            });
            
            // Store the token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    }

    static async register(username: string, password: string) {
        try {
            const response = await axiosInstance.post('/register/', {
                username,
                password
            });
            
            // Store the token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    }

    static async joinGame(gameId: number) {
        try {
            const response = await axiosInstance.post(`/games/${gameId}/join/`);
            return response.data;
        } catch (error: any) {
            console.error('Error joining game:', error);
            throw new Error(error.response?.data?.error || 'Failed to join game');
        }
    }

    static async getGame(gameId: number, retryCount = 3): Promise<any> {
        let lastError;
        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await axiosInstance.get(`/games/${gameId}/`);
                console.log('Game center coordinates:', response.data.center?.coordinates);
                return response.data;
            } catch (error: any) {
                lastError = error;
                if (error.code === 'ERR_NETWORK') {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw new Error(error.response?.data?.error || 'Failed to fetch game');
            }
        }
        console.error('Failed after retries:', lastError);
        throw new Error('Server is currently unavailable. Please try again later.');
    }

    static async getCurrentUser() {
        try {
            const response = await axiosInstance.get('/current-user/');
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            throw new Error('Not authenticated');
        }
    }

    static async createGame(data: { 
        kittyValuePerPlayer: number;
        center: [number, number];
        radius: number;
        area_set: boolean;
    }) {
        try {
            // Format kitty value to exactly 2 decimal places
            const kittyValue = Math.round(data.kittyValuePerPlayer * 100) / 100;
            
            const formattedData = {
                kitty_value_per_player: kittyValue,
                center: {
                    type: 'Point',
                    coordinates: [data.center[1], data.center[0]]
                },
                radius: data.radius,
                area_set: data.area_set
            };

            console.log('Sending formatted data to server:', formattedData);
            const response = await axiosInstance.post('/games/', formattedData);
            return response.data;
        } catch (error: any) {
            console.error('Server response:', error.response?.data);
            throw new Error(error.response?.data?.error || 'Failed to create game');
        }
    }

    static async logout() {
        try {
            // Call backend logout endpoint if you have one
            await axiosInstance.post('/logout/');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Clear any other stored data
            localStorage.clear();
        }
    }

    static async startGame(gameId: number): Promise<any> {
        try {
            const response = await axiosInstance.post(`/games/${gameId}/start/`);
            // Force a refresh of game data after starting
            await this.getGame(gameId);
            return response.data;
        } catch (error: any) {
            console.error('Error starting game:', error);
            throw new Error(error.response?.data?.error || 'Failed to start game');
        }
    }

    static async testAuth() {
        try {
            const token = localStorage.getItem('token');
            console.log('Testing auth with token:', token);
            
            const response = await axiosInstance.get('/current-user/');
            console.log('Auth test response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Auth test failed:', error);
            throw error;
        }
    }

    static async setGameArea(gameId: number, center: [number, number], radius: number) {
        try {
            console.log('Setting game area with:', {
                gameId,
                center,
                radius,
                url: `/api/games/${gameId}/set_area/`
            });

            const response = await axiosInstance.post(`/api/games/${gameId}/set_area/`, {
                center: {
                    type: 'Point',
                    coordinates: [center[1], center[0]] // Swap lat/lng for backend format
                },
                radius: radius
            });

            console.log('Set area response:', response.data);
            
            // Verify the area was set correctly
            const gameData = await this.getGame(gameId);
            console.log('Updated game data:', gameData);
            
            return response.data;
        } catch (error: any) {
            console.error('Set area error:', error.response || error);
            throw new Error(error.response?.data?.error || 'Failed to set game area');
        }
    }

    static async getGameMessages(gameId: number, retryCount = 3): Promise<Message[]> {
        let lastError;
        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await axiosInstance.get(`/games/${gameId}/messages/`);
                return response.data;
            } catch (error: any) {
                lastError = error;
                if (error.code === 'ERR_NETWORK') {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw new Error(error.response?.data?.error || 'Failed to fetch messages');
            }
        }
        console.error('Failed after retries:', lastError);
        throw new Error('Server is currently unavailable. Please try again later.');
    }

    static async sendGameMessage(gameId: number, content: string): Promise<Message> {
        try {
            console.log('Sending message:', { gameId, content });
            const response = await axiosInstance.post(`/games/${gameId}/messages/`, { 
                message: content.trim()
            });
            console.log('Message response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error sending message:', error);
            throw new Error(error.response?.data?.error || 'Failed to send message');
        }
    }

    static async updateGame(gameId: number, data: { 
        kitty_value_per_player: number;
        center: [number, number];
        radius: number;
        area_set: boolean;
    }) {
        try {
            const kittyValue = Math.round(data.kitty_value_per_player * 100) / 100;
            
            // Convert from [lat, lng] to [lng, lat] for the backend
            const formattedData = {
                kitty_value_per_player: kittyValue,
                center: {
                    type: 'Point',
                    coordinates: [data.center[1], data.center[0]] // Convert to [lng, lat]
                },
                radius: data.radius,
                area_set: data.area_set
            };
            
            console.log('Sending formatted data:', formattedData);
            const response = await axiosInstance.put(`/games/${gameId}/`, formattedData);
            return response.data;
        } catch (error: any) {
            console.error('Server response:', error.response?.data);
            throw new Error(error.response?.data?.error || 'Failed to update game');
        }
    }

    static async subtractFromKitty(gameId: number, amount: number): Promise<any> {
        try {
            const response = await axiosInstance.post(`/games/${gameId}/subtract-kitty/`, {
                amount
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to subtract from kitty');
        }
    }

    static async endGame(gameId: number): Promise<any> {
        try {
            const response = await axiosInstance.post(`/games/${gameId}/end/`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to end game');
        }
    }
}