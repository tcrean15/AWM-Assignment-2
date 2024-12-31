import React from 'react';
import { IonButton } from '@ionic/react';
import ActiveGame from './ActiveGame';

interface GameDetailProps {
    game: any;
    currentUser: any;
    onStartGame: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, currentUser, onStartGame }) => {
    const isHost = game.host.id === currentUser.id;
    const isWaiting = game.status === 'WAITING';
    const hasEnoughPlayers = game.players.length >= 2;

    console.log('Game Debug:', {
        game,
        currentUser,
        isHost,
        isWaiting,
        hasEnoughPlayers,
        status: game.status
    });

    // Show active game if status is ACTIVE
    if (game.status === 'ACTIVE') {
        return <ActiveGame 
            game={game}
            currentUser={currentUser}
        />;
    }

    // Show lobby if game is in WAITING state
    return (
        <div>
            <h2>Game Lobby</h2>
            <p>Players ({game.players.length}):</p>
            <ul>
                {game.players.map((player: any) => (
                    <li key={player.id}>{player.username}</li>
                ))}
            </ul>
            {isHost && isWaiting && hasEnoughPlayers && (
                <IonButton onClick={onStartGame}>
                    Start Game
                </IonButton>
            )}
        </div>
    );
};

export default GameDetail; 