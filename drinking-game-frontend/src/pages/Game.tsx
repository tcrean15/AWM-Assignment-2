import React, { useEffect, useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonToast,
} from '@ionic/react';
import { useParams } from 'react-router';
import { ApiService } from '../services/api.service';
import GameDetail from '../components/GameDetail';
import './Game.css';

const Game: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [game, setGame] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [present] = useIonToast();
    const [error, setError] = useState<string | null>(null);

    const loadGame = async () => {
        try {
            const gameData = await ApiService.getGame(parseInt(id));
            setGame(gameData);
        } catch (error) {
            console.error('Error loading game:', error);
            setError('Failed to load game');
        }
    };

    const loadCurrentUser = async () => {
        try {
            const userData = await ApiService.getCurrentUser();
            setCurrentUser(userData);
        } catch (error) {
            console.error('Error loading user:', error);
            setError('Failed to load user data');
        }
    };

    useEffect(() => {
        loadGame();
        loadCurrentUser();
    }, [id]);

    const handleStartGame = async () => {
        try {
            await ApiService.startGame(parseInt(id));
            await loadGame();
            present({
                message: 'Game started successfully!',
                duration: 2000,
                color: 'success'
            });
        } catch (error) {
            console.error('Error starting game:', error);
            present({
                message: 'Failed to start game',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Game {id}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {game && currentUser ? (
                    <GameDetail
                        game={game}
                        currentUser={currentUser}
                        onStartGame={handleStartGame}
                    />
                ) : (
                    <div>Loading...</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default Game;