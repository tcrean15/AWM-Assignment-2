import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';
import { Game, GamePlayer } from '../types/game';
import './GameLobby.css';

interface GameLobbyProps {
  game: Game;
  isHost: boolean;
  onStartGame: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ game, isHost, onStartGame }) => {
  console.log('Game data received:', game);
  
  // Group players by team
  const playersByTeam = game.players.reduce((acc, player) => {
    // Make sure we're using team_name from the player object
    const teamName = player.team_name || 'Unknown';
    console.log(`Player ${player.username} has team ${player.team} and team_name ${teamName}`);
    
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, GamePlayer[]>);

  console.log('Players grouped by team:', playersByTeam);

  const renderPlayer = (player: GamePlayer) => {
    const isHost = player.user.id === game.host.id;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isCurrentUser = player.user.id === currentUser.id;

    return (
      <div key={player.id} className={`player-item ${isCurrentUser ? 'current-user' : ''}`}>
        {player.username}
        {isHost && ' (Host)'}
        {isCurrentUser && ' (You)'}
      </div>
    );
  };

  return (
    <div className="game-lobby">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Game Status</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="teams-container">
            {/* Hunted Team */}
            <div className="team-section hunted">
              <h3>Hunted Team</h3>
              <div className="team-players">
                {playersByTeam['Hunted']?.map(player => renderPlayer(player))}
                {!playersByTeam['Hunted'] && <div>No hunted player assigned</div>}
              </div>
            </div>

            {/* Hunters Teams */}
            <div className="team-section hunters">
              <h3>Hunters Teams</h3>
              <div className="team-players">
                {playersByTeam['Hunters Team 1']?.map(player => (
                  <div key={player.id} className="hunter-team">
                    <h4>Team 1</h4>
                    {renderPlayer(player)}
                  </div>
                ))}
                {playersByTeam['Hunters Team 2']?.map(player => (
                  <div key={player.id} className="hunter-team">
                    <h4>Team 2</h4>
                    {renderPlayer(player)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && game.status === 'WAITING' && (
            <IonButton 
              expand="block" 
              onClick={onStartGame}
              className="start-button"
              disabled={game.players.length < 3}
            >
              Start Game
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default GameLobby; 