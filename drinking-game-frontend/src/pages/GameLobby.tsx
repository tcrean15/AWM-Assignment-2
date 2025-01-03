import React, { useEffect, useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonLabel,
    IonItem,
    useIonToast,
    IonButtons,
    IonBackButton,
    IonText
} from '@ionic/react';
import { useParams, useHistory } from 'react-router';
import { ApiService } from '../services/api.service';
import { Game } from '../types/game';
import { playOutline, peopleOutline, walletOutline, personOutline, createOutline } from 'ionicons/icons';
import './GameLobby.css';

const GameLobby: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [presentToast] = useIonToast();
    const history = useHistory();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [connectionError, setConnectionError] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const fetchGameData = async () => {
        try {
            const gameData = await ApiService.getGame(parseInt(id));
            setGame(gameData);
            setConnectionError(false);

            // Check if game status has changed to ACTIVE
            if (gameData.status === 'ACTIVE') {
                history.push(`/game/${id}`);
            }
        } catch (error: any) {
            if (error.message.includes('Unable to connect to server')) {
                setConnectionError(true);
            }
            presentToast({
                message: error.message,
                duration: 2000,
                color: 'danger'
            });
        }
    };

    useEffect(() => {
        const checkGameAccess = async () => {
            try {
                const gameData = await ApiService.getGame(parseInt(id));
                // Check if user is part of the game
                const isPlayerInGame = gameData.players.some(
                    player => player.user.id === currentUser.id
                );
                
                if (!isPlayerInGame) {
                    history.push('/join-game');
                    presentToast({
                        message: 'You must join the game first',
                        duration: 2000,
                        color: 'warning'
                    });
                    return;
                }

                // Check if game is already active
                if (gameData.status === 'ACTIVE') {
                    history.push(`/game/${id}`);
                    return;
                }
                
                setGame(gameData);
            } catch (error) {
                presentToast({
                    message: 'Failed to fetch game data',
                    duration: 2000,
                    color: 'danger'
                });
            }
        };

        checkGameAccess();
        // Poll every 3 seconds
        const interval = setInterval(fetchGameData, 3000);
        return () => clearInterval(interval);
    }, [id, currentUser.id, history, presentToast]);

    const handleStartGame = async () => {
        try {
            await ApiService.startGame(parseInt(id));
            history.push(`/game/${id}`);
        } catch (error: any) {
            presentToast({
                message: error.message || 'Failed to start game',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    if (connectionError) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Connection Error</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className="error-container">
                        <IonText color="danger">
                            <h2>Unable to connect to server</h2>
                            <p>Please check if the server is running and try again.</p>
                        </IonText>
                        <IonButton onClick={() => window.location.reload()}>
                            Retry Connection
                        </IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!game) {
        return <div>Loading...</div>;
    }

    const isHost = game.host.id === currentUser.id;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
                    {isHost && (
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/create-game" />
          </IonButtons>
                    )}
                    <IonTitle>Game Lobby {id}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
                <IonCard>
                    <IonCardContent>
                        <IonItem lines="none">
                            <IonIcon icon={peopleOutline} slot="start" />
                            <IonLabel>
                                Players ({game.players.length})
                                {game.players.length < 3 && " (Need at least 3 players)"}
                            </IonLabel>
                        </IonItem>

                        <div className="players-list">
                            {game.players.map(player => (
                                <IonItem key={player.id} lines="none" className="player-item">
                                    <IonIcon icon={personOutline} slot="start" />
                                    <IonLabel>
                                        {player.username}
                                        {player.user.id === game.host.id && " (Host)"}
                                        {player.user.id === currentUser.id && " (You)"}
                                    </IonLabel>
                                </IonItem>
                            ))}
                        </div>

                        <IonItem>
                            <IonIcon icon={walletOutline} slot="start" />
                            <IonLabel>
                                Contribution per player: €{game.kitty_value_per_player}
                                <br />
                                Total Kitty: €{game.total_kitty}
                            </IonLabel>
                        </IonItem>

                        <div className="game-status">
                            {game.players.length < 3 ? (
                                <IonText color="medium" className="waiting-text">
                                    Waiting for more players to join...
                                </IonText>
                            ) : !isHost && (
                                <IonText color="medium" className="waiting-text">
                                    Waiting for host to start the game...
                                </IonText>
                            )}
                        </div>

                        {isHost && (
                            <div className="host-controls">
                                <IonButton
                                    expand="block"
                                    onClick={handleStartGame}
                                    disabled={game.players.length < 3}
                                    className="start-button"
                                >
                                    <IonIcon slot="start" icon={playOutline} />
                                    Start Game
                                </IonButton>

                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    color="medium"
                                    className="edit-button"
                                    onClick={() => history.push('/create-game', { gameId: id })}
                                >
                                    <IonIcon slot="start" icon={createOutline} />
                                    Edit Game Settings
                                </IonButton>
                            </div>
                        )}
                    </IonCardContent>
                </IonCard>
      </IonContent>
    </IonPage>
  );
}; 

export default GameLobby; 