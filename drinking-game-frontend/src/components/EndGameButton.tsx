import { IonButton, useIonAlert, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { API_URL } from '../config';

interface EndGameButtonProps {
  gameId: number;
}

const EndGameButton: React.FC<EndGameButtonProps> = ({ gameId }) => {
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();

  const handleEndGame = async () => {
    presentAlert({
      header: 'End Game',
      message: 'Are you sure you want to end the game?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'End Game',
          role: 'confirm',
          handler: async () => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/games/${gameId}/end/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json',
                }
              });

              if (response.ok) {
                present({
                  message: 'Game ended successfully',
                  duration: 2000,
                  color: 'success'
                });
                history.push('/home');
              } else {
                const data = await response.json();
                present({
                  message: data.error || 'Failed to end game',
                  duration: 2000,
                  color: 'danger'
                });
              }
            } catch (error) {
              console.error('End game failed:', error);
              present({
                message: 'Failed to end game',
                duration: 2000,
                color: 'danger'
              });
            }
          },
        },
      ],
    });
  };

  return (
    <IonButton onClick={handleEndGame} color="danger">
      End Game
    </IonButton>
  );
};

export default EndGameButton; 