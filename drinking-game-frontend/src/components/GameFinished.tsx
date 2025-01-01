import React from 'react';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonList, IonItem, IonLabel } from '@ionic/react';
import { useGame } from '../contexts/GameContext';

interface Team {
    id: string;
    players: string[];
}

const GameFinished: React.FC = () => {
    const { game, createGame } = useGame();

    if (!game) return null;

    const handlePlayAgain = async () => {
        await createGame();
    };

    return (
        <IonContent>
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Game Complete!</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                    <IonList>
                        <IonItem>
                            <IonLabel>
                                <h2>Game Statistics</h2>
                                <p>Duration: {calculateGameDuration(game)}</p>
                                <p>Total Hints: {game.hints.length}</p>
                                <p>Final Area Size: {Math.round(game.currentArea.radius)}m</p>
                            </IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>
                                <h2>Winning Team</h2>
                                {game.teams.map((team: Team) => (
                                    team.players.map(player => (
                                        <p key={player}>{getPlayerName(game, player)}</p>
                                    ))
                                ))}
                            </IonLabel>
                        </IonItem>
                    </IonList>

                    <IonButton expand="block" onClick={handlePlayAgain}>
                        Play Again
                    </IonButton>
                </IonCardContent>
            </IonCard>
        </IonContent>
    );
};

// Helper functions
const calculateGameDuration = (game: any) => {
    const startTime = new Date(game.startTime);
    const endTime = new Date(game.endTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
    return `${duration} minutes`;
};

const getPlayerName = (game: any, playerId: string) => {
    const player = game.players.find((p: any) => p.id === playerId);
    return player ? player.username : 'Unknown Player';
};

export default GameFinished; 