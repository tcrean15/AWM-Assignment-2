import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonToast,
    useIonViewDidEnter,
    useIonViewWillLeave,
    useIonRouter
} from '@ionic/react';
import { useParams } from 'react-router';
import { ApiService } from '../services/api.service';
import GameDetail from '../components/GameDetail';
import { GameProvider } from '../contexts/GameContext';
import GameMessage from '../components/GameMessage';
import GameChatButton from '../components/GameChatButton';
import { Message } from '../types/game';

interface GameState {
    id: number;
    status: string;
    current_area: string;
    radius: number;
    players: any[];
    [key: string]: any;
}

const Game: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [present] = useIonToast();
    const navigate = useIonRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    useIonViewDidEnter(() => {
        // Reset focus when entering the page
        document.querySelector('.game-container')?.setAttribute('tabindex', '-1');
        (document.querySelector('.game-container') as HTMLElement)?.focus();
    });

    useIonViewWillLeave(() => {
        // Clean up when leaving the page
        document.querySelector('.game-container')?.removeAttribute('tabindex');
    });

    const loadGame = useCallback(async () => {
        try {
            const gameData = await ApiService.getGame(parseInt(id));
            setGameState((prevState: GameState | null) => {
                if (JSON.stringify(prevState) !== JSON.stringify(gameData)) {
                    return gameData;
                }
                return prevState;
            });
            setServerError(null);
        } catch (error: any) {
            console.error('Error loading game:', error);
            if (error.message.includes('Server is currently unavailable')) {
                setServerError('Server is currently unavailable. Please ensure the backend server is running.');
            } else {
                setServerError(error.message || 'Failed to load game');
            }
        }
    }, [id]);

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
    }, [loadGame]);

    // Fetch messages periodically
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const newMessages = await ApiService.getGameMessages(parseInt(id));
                
                // Sort messages by creation time
                const sortedMessages = newMessages.sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                setMessages(sortedMessages);
            } catch (error: any) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const handleSendMessage = async (message: string) => {
        try {
            const newMessage = await ApiService.sendGameMessage(parseInt(id), message);
            // Add new message to the end of the array (maintaining chronological order)
            setMessages((prev: Message[]) => [...prev, newMessage]);
        } catch (error: any) {
            present({
                message: error.message || 'Failed to send message',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const handleStartGame = async () => {
        try {
            const updatedGame = await ApiService.startGame(gameState.id);
            console.log('Game started:', updatedGame);
            setGameState(updatedGame);
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    const pollGameState = useCallback(async () => {
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 3;

        try {
            const updatedGame = await ApiService.getGame(parseInt(id));
            setGameState(updatedGame);
            setServerError(null);
            consecutiveErrors = 0;
        } catch (error: any) {
            console.error('Error polling game state:', error);
            consecutiveErrors++;

            if (consecutiveErrors >= maxConsecutiveErrors) {
                if (error.message.includes('Server is currently unavailable')) {
                    setServerError('Server connection lost. Attempting to reconnect...');
                } else {
                    setServerError(error.message || 'Failed to update game state');
                }
            }
        }
    }, [id]);

    useEffect(() => {
        const pollInterval = setInterval(pollGameState, 5000);
        
        // Initial poll
        pollGameState();

        return () => clearInterval(pollInterval);
    }, [pollGameState]);

    // Update the handleSubtractFromKitty function
    const handleSubtractFromKitty = async (amount: number) => {
        try {
            const response = await ApiService.subtractFromKitty(parseInt(id), amount);
            
            // Update game state immediately after successful subtraction
            const updatedGame = await ApiService.getGame(parseInt(id));
            setGameState(updatedGame);

            // Show success message
            present({
                message: response.message,
                duration: 2000,
                color: 'success'
            });
        } catch (error: any) {
            present({
                message: error.message || 'Failed to subtract from kitty',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const handleGameUpdate = async () => {
        try {
            const updatedGame = await ApiService.getGame(parseInt(id));
            setGameState(updatedGame);
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    };

    useEffect(() => {
        if (gameState?.status === 'FINISHED') {
            present({
                message: 'Game has ended! Redirecting to home...',
                duration: 2000,
                color: 'warning'
            });
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/home';
            }, 2000);
        }
    }, [gameState?.status]);

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
                        {serverError ? (
                            <div className="server-error">
                                <IonCard>
                                    <IonCardHeader>
                                        <IonCardTitle color="danger">Server Error</IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <p>{serverError}</p>
                                        <IonButton routerLink="/home">Return Home</IonButton>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        ) : gameState ? (
                            <>
                                <GameDetail
                                    game={gameState}
                                    currentUser={currentUser}
                                    onStartGame={handleStartGame}
                                    onGameUpdate={handleGameUpdate}
                                />
                                {messages.length > 0 && (
                                    <GameMessage 
                                        message={messages[messages.length - 1]} 
                                    />
                                )}
                                <GameChatButton 
                                    gameId={parseInt(id)} 
                                    onSend={handleSendMessage}
                                    messages={messages}
                                />
                            </>
                        ) : (
                            <div className="loading-container">Loading game data...</div>
                        )}
                    </GameProvider>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default React.memo(Game);