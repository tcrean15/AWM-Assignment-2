import { 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonButton,
  IonText
} from '@ionic/react';
import React from 'react';

interface GameDetailProps {
  game: any;
  currentUser: any;
  onStartGame: () => void;
}

const GameDetail: React.FC<GameDetailProps> = ({ game, currentUser, onStartGame }) => {
  const isHost = currentUser?.id === game.host?.id;
  const isWaiting = game.status === 'WAITING';
  const hasEnoughPlayers = game.players?.length >= 2;
  const canStartGame = isHost && isWaiting && hasEnoughPlayers;

  console.log('Game Debug:', {
    game,
    currentUser,
    isHost,
    isWaiting,
    hasEnoughPlayers,
    canStartGame
  });

  return (
    <div className="game-detail">
      <h2>Game #{game.id}</h2>
      <p>Status: {game.status}</p>
      <p>Players: {game.players?.length || 0}</p>
      <p>Host: {game.host?.username}</p>

      <div className="debug-info">
        <h3>Debug Info:</h3>
        <p>Is Host: {isHost ? 'Yes' : 'No'}</p>
        <p>Can Start: {canStartGame ? 'Yes' : 'No'}</p>
        <p>Status is WAITING: {isWaiting ? 'Yes' : 'No'}</p>
        <p>Enough Players: {hasEnoughPlayers ? 'Yes' : 'No'}</p>
      </div>

      {canStartGame && (
        <IonButton onClick={onStartGame}>
          Start Game
        </IonButton>
      )}
    </div>
  );
};

export default GameDetail; 