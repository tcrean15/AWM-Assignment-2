import React, { useEffect, useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonToast,
    useIonViewDidEnter,
    useIonViewWillLeave
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

    useIonViewDidEnter(() => {
        // Reset focus when entering the page
        document.querySelector('.game-container')?.setAttribute('tabindex', '-1');
        (document.querySelector('.game-container') as HTMLElement)?.focus();
    });

    useIonViewWillLeave(() => {
        // Clean up when leaving the page
        document.querySelector('.game-container')?.removeAttribute('tabindex');
    });

    const loadGame = async () => {
        try {
            const gameData = await ApiService.getGame(parseInt(id));
            setGame(gameData);
        } catch (error) {
            console.error('Error loading game:', error);
            present({
                message: 'Failed to load game',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const loadCurrentUser = async () => {
        try {
            const userData = await ApiService.getCurrentUser();
            setCurrentUser(userData);
        } catch (error) {
            console.error('Error loading user:', error);
            present({
                message: 'Failed to load user data',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    useEffect(() => {
        loadGame();
        loadCurrentUser();
        const interval = setInterval(loadGame, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const handleStartGame = async () => {
        try {
            const updatedGame = await ApiService.startGame(game.id);
            console.log('Game started:', updatedGame);
            setGame(updatedGame);
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Game {id}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div className="game-container" role="main">
                    <GameProvider>
                        {game && currentUser ? (
                            <GameDetail
                                game={game}
                                currentUser={currentUser}
                                onStartGame={handleStartGame}
                            />
                        ) : (
                            <div className="loading-container">Loading game data...</div>
                        )}
                    </GameProvider>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Game;