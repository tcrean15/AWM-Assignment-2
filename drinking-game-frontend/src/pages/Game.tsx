import React, { useEffect, useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonToast,
    IonButton,
} from '@ionic/react';
import { useParams } from 'react-router';
import { ApiService } from '../services/api.service';
import GameDetail from '../components/GameDetail';
import { GameProvider } from '../contexts/GameContext';

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
        // Set up polling for game updates
        const interval = setInterval(loadGame, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const handleStartGame = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Current token:', token); // Debug log
            
            if (!token) {
                present({
                    message: 'Please log in first',
                    duration: 2000,
                    color: 'warning'
                });
                return;
            }

            // Test authentication
            const currentUser = await ApiService.getCurrentUser();
            console.log('Current user:', currentUser); // Debug log

            await ApiService.startGame(parseInt(id));
            await loadGame();
            present({
                message: 'Game started successfully!',
                duration: 2000,
                color: 'success'
            });
        } catch (error: any) {
            console.error('Error starting game:', error);
            present({
                message: error.message || 'Failed to start game. Please ensure you are logged in and are the host.',
                duration: 3000,
                color: 'danger'
            });
        }
    };

    const testAuthentication = async () => {
        try {
            const result = await ApiService.testAuth();
            console.log('Auth test result:', result);
            present({
                message: 'Authentication successful',
                duration: 2000,
                color: 'success'
            });
        } catch (error) {
            console.error('Auth test failed:', error);
            present({
                message: 'Authentication failed',
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
                <GameProvider>
                    <IonButton onClick={testAuthentication}>
                        Test Authentication
                    </IonButton>
                    {game && currentUser ? (
                        <GameDetail
                            game={game}
                            currentUser={currentUser}
                            onStartGame={handleStartGame}
                        />
                    ) : (
                        <div>Loading...</div>
                    )}
                </GameProvider>
            </IonContent>
        </IonPage>
    );
};

export default Game;