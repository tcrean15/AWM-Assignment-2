import { useEffect, useState } from 'react';
import { IonContent, IonList, IonItem, IonLabel, IonButton } from '@ionic/react';
import { useGame } from '../contexts/GameContext';

interface Player {
    id: string;
    user: {
        username: string;
    };
    team?: number;
}

const GameLobby: React.FC = () => {
    const { game, startGame, isHost } = useGame();
    const [error, setError] = useState<string | null>(null);

    const handleStartGame = async () => {
        try {
            await startGame();
        } catch (err: any) {
            setError(err?.message || 'An error occurred');
        }
    };

    return (
        <IonContent>
            <IonList>
                <IonItem>
                    <IonLabel>
                        <h2>Game Lobby</h2>
                        <p>Players: {game?.players?.length || 0}/8</p>
                    </IonLabel>
                </IonItem>

                {game?.players?.map((player: Player) => (
                    <IonItem key={player.id}>
                        <IonLabel>
                            {player.user.username}
                            {player.team && (
                                <span className={`team-${player.team}`}>
                                    Team {player.team}
                                </span>
                            )}
                        </IonLabel>
                    </IonItem>
                ))}

                {isHost && (
                    <IonButton 
                        expand="block"
                        onClick={handleStartGame}
                        disabled={game?.players?.length < 3}
                    >
                        Start Game
                    </IonButton>
                )}

                {error && (
                    <IonItem color="danger">
                        <IonLabel>{error}</IonLabel>
                    </IonItem>
                )}
            </IonList>
        </IonContent>
    );
};

export default GameLobby; 