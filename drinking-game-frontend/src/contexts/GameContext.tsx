import React, { createContext, useContext, useState } from 'react';

interface GameContextType {
    game: any;
    updatePlayerLocation: (location: [number, number]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [game, setGame] = useState<any>(null);

    const updatePlayerLocation = async (location: [number, number]) => {
        // Implement location update logic
        console.log('Updating location:', location);
    };

    return (
        <GameContext.Provider value={{ game, updatePlayerLocation }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}; 