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
import './Register.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();
  const [present] = useIonToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await ApiService.register(username, password);
      console.log('Registration successful:', response);
      
      present({
        message: 'Registration successful! Logging you in...',
        duration: 2000,
        color: 'success'
      });
      
      // Automatically log in after registration
      await ApiService.login(username, password);
      
      history.push('/home');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      present({
        message: error.message || 'Registration failed',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form onSubmit={handleRegister} className="register-form">
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

          <IonItem>
            <IonLabel position="stacked">Confirm Password</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonChange={e => setConfirmPassword(e.detail.value!)}
              required
            />
          </IonItem>

          {error && (
            <IonText color="danger">
              <p className="ion-padding-start">{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin">
            Register
          </IonButton>

          <IonButton expand="block" fill="clear" routerLink="/login" className="ion-margin">
            Already have an account? Login
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register; 