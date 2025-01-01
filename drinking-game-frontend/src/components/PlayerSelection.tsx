import React, { useState } from 'react';
import { IonContent, IonList, IonItem, IonLabel, IonButton, IonText } from '@ionic/react';
import { useGame } from '../contexts/GameContext';

const PlayerSelection: React.FC = () => {
    const { game, isHost, selectPlayer } = useGame();
    const [error, setError] = useState('');

    if (!game) return null;

    const handlePlayerSelect = async (playerId: string) => {
        try {
            await selectPlayer(playerId);
        } catch (err) {
            setError('Failed to select player');
        }
    };

    const minPlayersReached = game.players.length >= 3;

    return (
        <IonContent>
            <IonList>
                <IonItem>
                    <IonLabel>
                        Players ({game.players.length}/3 minimum)
                    </IonLabel>
                </IonItem>

                {game.players.map((player: { id: string; username: string }) => (
                    <IonItem key={player.id}>
                        <IonLabel>{player.username}</IonLabel>
                        {isHost && minPlayersReached && (
                            <IonButton 
                                slot="end"
                                onClick={() => handlePlayerSelect(player.id)}
                            >
                                Select
                            </IonButton>
                        )}
                    </IonItem>
                ))}

                {!minPlayersReached && (
                    <IonItem>
                        <IonText color="warning">
                            Waiting for more players to join...
                        </IonText>
                    </IonItem>
                )}

                {error && (
                    <IonItem>
                        <IonText color="danger">{error}</IonText>
                    </IonItem>
                )}
            </IonList>
        </IonContent>
    );
};

export default PlayerSelection; 