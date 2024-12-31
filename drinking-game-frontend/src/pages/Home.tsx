import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonToast } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router';
import { ApiService } from '../services/api.service';
import './Home.css';

const Home: React.FC = () => {
    const history = useHistory();
    const [gameId, setGameId] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const createGame = async () => {
        try {
            // Example area coordinates (you'll want to let users draw this on a map)
            const area = [[[53.3498, -6.2603], [53.3498, -6.2403], [53.3298, -6.2403], [53.3298, -6.2603], [53.3498, -6.2603]]];
            const game = await ApiService.createGame(area);
            history.push(`/game/${game.id}`);
        } catch (error: any) {
            console.error('Error creating game:', error);
            setErrorMessage(error.message || 'Failed to create game');
            setShowError(true);
        }
    };

    const joinGame = async () => {
        try {
            await ApiService.joinGame(parseInt(gameId));
            history.push(`/game/${gameId}`);
        } catch (error: any) {
            console.error('Error joining game:', error);
            setErrorMessage(error.message || 'Failed to join game');
            setShowError(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Drinking Game</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div className="container">
                    <IonButton expand="block" onClick={createGame}>
                        Create New Game
                    </IonButton>
                    <div className="join-game">
                        <input
                            type="text"
                            placeholder="Enter Game ID"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                        />
                        <IonButton expand="block" onClick={joinGame}>
                            Join Game
                        </IonButton>
                    </div>
                </div>
                <IonToast
                    isOpen={showError}
                    onDidDismiss={() => setShowError(false)}
                    message={errorMessage}
                    duration={3000}
                    color="danger"
                />
            </IonContent>
        </IonPage>
    );
};

export default Home;