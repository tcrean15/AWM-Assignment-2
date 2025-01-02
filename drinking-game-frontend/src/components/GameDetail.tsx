import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonToast } from '@ionic/react';
import ActiveGame from './ActiveGame';
import AreaSelector from './AreaSelector';
import './AreaSelector.css';
import { ApiService } from '../services/api.service';

interface Player {
    id: number;
    user: {
        id: number;
        username: string;
    };
    team?: number;
}

interface GameDetailProps {
    game: any;
    currentUser: any;
    onStartGame: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, currentUser, onStartGame }) => {
    const [areaSet, setAreaSet] = useState(game?.area_set || false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        setAreaSet(game?.area_set || false);
    }, [game?.area_set]);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const response = await fetch(`/api/games/${game.id}/`);
                const data = await response.json();
                console.log('Raw game data from API:', data);
                setGame(data);
            } catch (error) {
                console.error('Error fetching game:', error);
            }
        };

        fetchGameData();
    }, [game.id]);

    console.log('Game status:', game.status);

    if (!game || !currentUser || !game.host) {
        return <div>Loading...</div>;
    }

    const isHost = game.host.id === currentUser.id;
    const isWaiting = game.status === 'WAITING';
    const hasEnoughPlayers = game.players?.length >= 2;

    const handleAreaConfirm = async (center: [number, number], radius: number) => {
        try {
            await ApiService.setGameArea(game.id, center, radius);
            setAreaSet(true);
            setToastMessage('Game area set successfully');
            setShowToast(true);
        } catch (error) {
            console.error('Error setting game area:', error);
            setToastMessage('Failed to set game area');
            setShowToast(true);
        }
    };

    const renderPlayerList = () => {
        if (!game.players || !Array.isArray(game.players)) {
            return <div>No players yet</div>;
        }

        return (
            <div>
                <h3>Players ({game.players.length}):</h3>
                <ul>
                    {game.players.map((player: any) => {
                        const username = player.user?.username || player.username;
                        const playerId = player.user?.id || player.id;
                        
                        if (!username) return null;
                        
                        return (
                            <li key={`player-${playerId}`}>
                                {username}
                                {player.team !== undefined ? ` (Team ${player.team})` : ''}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    if (game.status === 'ACTIVE') {
        return <ActiveGame game={game} currentUser={currentUser} />;
    }

    if (game.status === 'SETUP') {
        return <AreaSelector onAreaConfirmed={handleAreaConfirm} />;
    }

    return (
        <div className="game-detail-container">
            <h2>Game Lobby</h2>
            
            {isHost && !areaSet && (
                <div className="area-selector-container">
                    <h3>Set Game Area</h3>
                    <p>Click on the map to select the game area center point</p>
                    <AreaSelector 
                        gameId={game.id}
                        isHost={isHost}
                        onAreaConfirmed={handleAreaConfirm}
                    />
                </div>
            )}

            {renderPlayerList()}

            {isHost && isWaiting && hasEnoughPlayers && (
                <IonButton 
                    onClick={onStartGame}
                    disabled={!areaSet}
                    expand="block"
                    className="start-game-button"
                >
                    {areaSet ? 'Start Game' : 'Set Area First'}
                </IonButton>
            )}

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={2000}
            />
        </div>
    );
};

export default GameDetail; 