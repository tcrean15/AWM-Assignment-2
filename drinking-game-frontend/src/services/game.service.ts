import { ApiService } from './api.service';

const VICTORY_DISTANCE = 20; // Distance in meters to consider a team has found the selected player

export const GameService = {
    checkVictoryCondition: async (gameId: string, playerLocation: [number, number], selectedPlayerLocation: [number, number]) => {
        const distance = calculateDistance(playerLocation, selectedPlayerLocation);
        
        if (distance <= VICTORY_DISTANCE) {
            await ApiService.endGame(gameId);
            return true;
        }
        return false;
    }
};

// Helper function to calculate distance between two points
const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1[0] * Math.PI/180;
    const φ2 = point2[0] * Math.PI/180;
    const Δφ = (point2[0]-point1[0]) * Math.PI/180;
    const Δλ = (point2[1]-point1[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}; 