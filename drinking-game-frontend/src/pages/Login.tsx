import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  useIonToast
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router';
import { ApiService } from '../services/api.service';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();
  const [present] = useIonToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await ApiService.login(username, password);
      console.log('Login successful:', response);
      present({
        message: 'Login successful!',
        duration: 2000,
        color: 'success'
      });
      history.push('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      present({
        message: 'Login failed',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form onSubmit={handleLogin} className="login-form">
          <IonItem>
            <IonLabel position="stacked">Username</IonLabel>
            <IonInput
              type="text"
              value={username}
              onIonChange={e => setUsername(e.detail.value!)}
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              required
            />
          </IonItem>

          {error && (
            <IonText color="danger">
              <p className="ion-padding-start">{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin">
            Login
          </IonButton>

          <IonButton expand="block" fill="clear" routerLink="/register" className="ion-margin">
            New user? Register here
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login; 