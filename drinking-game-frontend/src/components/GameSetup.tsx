import React, { useState } from 'react';
import { IonContent, IonButton, IonInput, IonItem, IonLabel, IonList, IonText } from '@ionic/react';
import { useGame } from '../contexts/GameContext';

const GameSetup: React.FC = () => {
    const [gameId, setGameId] = useState('');
    const [error, setError] = useState('');
    const { createGame, joinGame } = useGame();

    const handleCreateGame = async () => {
        try {
            setError('');
            await createGame();
        } catch (err) {
            setError('Failed to create game');
        }
    };

    const handleJoinGame = async () => {
        try {
            setError('');
            if (!gameId.trim()) {
                setError('Please enter a game ID');
                return;
            }
            await joinGame(gameId);
        } catch (err) {
            setError('Failed to join game');
        }
    };

    return (
        <IonContent>
            <IonList>
                <IonItem>
                    <IonButton expand="block" onClick={handleCreateGame}>
                        Create New Game
                    </IonButton>
                </IonItem>

                <IonItem>
                    <IonLabel position="stacked">Game ID</IonLabel>
                    <IonInput
                        value={gameId}
                        onIonChange={e => setGameId(e.detail.value || '')}
                        placeholder="Enter game ID to join"
                    />
                </IonItem>

                <IonItem>
                    <IonButton expand="block" onClick={handleJoinGame}>
                        Join Game
                    </IonButton>
                </IonItem>

                {error && (
                    <IonItem>
                        <IonText color="danger">{error}</IonText>
                    </IonItem>
                )}
            </IonList>
        </IonContent>
    );
};

export default GameSetup; 