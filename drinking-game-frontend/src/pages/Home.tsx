import React from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
} from '@ionic/react';
import { addCircleOutline, logInOutline } from 'ionicons/icons';
import './Home.css';

const Home: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Pub Hunt</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonCard className="welcome-card">
                    <IonCardHeader>
                        <IonCardTitle>Welcome to Pub Hunt</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <h2>How to Play</h2>
                        <p>
                            Pub Hunt is an exciting real-world drinking game that combines hide and seek with pub crawling!
                        </p>

                        <h3>Game Setup</h3>
                        <ul>
                            <li>Minimum 3 players required</li>
                            <li>One player hosts the game</li>
                            <li>Other players join using the game code</li>
                            <li>All players contribute to the kitty (prize pool)</li>
                        </ul>

                        <h3>Roles</h3>
                        <ul>
                            <li><strong>The Hunted:</strong> One randomly selected player who must find a pub to hide in</li>
                            <li><strong>The Hunters:</strong> Other players split into teams of 2 who must find the hunted player</li>
                        </ul>

                        <h3>Gameplay</h3>
                        <ul>
                            <li>Host sets the game area and kitty value</li>
                            <li>The hunted player can subtract from the kitty during the game</li>
                            <li>Hunters must work together to find the hunted player</li>
                            <li>Find the hunted player to take part in spending the kitty</li>
                        </ul>

                        <div className="action-buttons">
                            <IonGrid>
                                <IonRow>
                                    <IonCol>
                                        <IonButton 
                                            expand="block" 
                                            routerLink="/create-game"
                                            color="primary"
                                        >
                                            <IonIcon slot="start" icon={addCircleOutline} />
                                            Create Game
                                        </IonButton>
                                    </IonCol>
                                    <IonCol>
                                        <IonButton 
                                            expand="block" 
                                            routerLink="/join-game"
                                            color="secondary"
                                        >
                                            <IonIcon slot="start" icon={logInOutline} />
                                            Join Game
                                        </IonButton>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </div>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Home;