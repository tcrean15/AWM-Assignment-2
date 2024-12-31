const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const websocketService = {
    socket: null as WebSocket | null,
    messageHandlers: [] as ((data: any) => void)[],
    
    connect(gameId: number) {
        this.socket = new WebSocket(`${WS_URL}/game/${gameId}/`);
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(data));
        };
    },

    onMessage(handler: (data: any) => void) {
        this.messageHandlers.push(handler);
    },

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
};