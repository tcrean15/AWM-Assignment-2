import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  useIonToast
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import GameDetail from '../components/GameDetail';
import { ApiService } from '../services/api.service';

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [present] = useIonToast();

  useEffect(() => {
    loadGame();
    loadCurrentUser();
  }, [id]);

  const loadGame = async () => {
    try {
      const data = await ApiService.getGame(Number(id));
      setGame(data);
    } catch (error) {
      present({
        message: 'Error loading game',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await ApiService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      await ApiService.startGame(Number(id));
      loadGame(); // Reload game data after starting
      present({
        message: 'Game started successfully!',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      present({
        message: 'Error starting game',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Game Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {game && (
          <GameDetail 
            game={game}
            currentUser={currentUser}
            onStartGame={handleStartGame}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default GamePage; 