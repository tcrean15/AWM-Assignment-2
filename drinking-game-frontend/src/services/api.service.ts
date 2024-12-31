import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
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

    static async getGame(gameId: number) {
        try {
            const response = await axiosInstance.get(`/games/${gameId}/`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting game:', error);
            throw new Error(error.response?.data?.error || 'Failed to get game');
        }
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

    static async createGame(area?: number[][][]) {
        try {
            const response = await axiosInstance.post('/games/', { area });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to create game');
        }
    }

    static async startGame(gameId: number) {
        try {
            const response = await axiosInstance.post(`/games/${gameId}/start/`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to start game');
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}