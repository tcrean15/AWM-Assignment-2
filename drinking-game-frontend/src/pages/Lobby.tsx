import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonList, IonItem } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router';
import { ApiService } from '../services/api.service';
import './Lobby.css';

const Lobby: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [players, setPlayers] = useState<any[]>([]);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        loadLobbyData();
    }, [id]);

    const loadLobbyData = async () => {
        try {
            const game = await ApiService.getGame(parseInt(id));
            setPlayers(game.players);
            // Check if current user is host
            setIsHost(game.host === 'current_user'); // You'll need to implement this check
        } catch (error) {
            console.error('Failed to load lobby data:', error);
        }
    };

    const startGame = async () => {
        try {
            await ApiService.startGame(parseInt(id));
            history.push(`/game/${id}`);
        } catch (error) {
            console.error('Failed to start game:', error);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Game Lobby</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div className="lobby-container">
                    <h2>Players</h2>
                    <IonList>
                        {players.map(player => (
                            <IonItem key={player.id}>
                                {player.username}
                            </IonItem>
                        ))}
                    </IonList>
                    {isHost && (
                        <IonButton expand="block" onClick={startGame}>
                            Start Game
                        </IonButton>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Lobby; 