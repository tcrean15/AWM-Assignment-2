import LogoutButton from '../components/LogoutButton';
import EndGameButton from '../components/EndGameButton';

const GameLobby: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Game Lobby</IonTitle>
          <IonButtons slot="end">
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isHost && <EndGameButton gameId={gameId} />}
      </IonContent>
    </IonPage>
  );
}; 