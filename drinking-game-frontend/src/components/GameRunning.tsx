import React, { useEffect, useState } from 'react';
import { IonContent, IonButton, IonList, IonItem, IonLabel, IonText, IonInput } from '@ionic/react';
import { MapContainer, Circle, Marker, TileLayer } from 'react-leaflet';
import { useGame } from '../contexts/GameContext';
import ImageUpload from './ImageUpload';
import TeamChat from './TeamChat';

interface Player {
    id: string;
    location: [number, number] | null;
}

interface Hint {
    time: string;
    message: string;
}

const GameRunning: React.FC = () => {
    const { game, updatePlayerLocation, addHint } = useGame();
    const [hint, setHint] = useState('');
    const [timeToNextHint, setTimeToNextHint] = useState<number>(0);
    const [timeToNextAreaReduction, setTimeToNextAreaReduction] = useState<number>(0);

    useEffect(() => {
        // Update player location every 30 seconds
        const locationInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                updatePlayerLocation([latitude, longitude]);
            });
        }, 30000);

        // Timer for hints (15 minutes)
        const hintInterval = setInterval(() => {
            const nextHintTime = 15 * 60;
            setTimeToNextHint(prevTime => {
                if (prevTime <= 0) return nextHintTime;
                return prevTime - 1;
            });
        }, 1000);

        // Timer for area reduction (25 minutes)
        const areaInterval = setInterval(() => {
            const nextAreaTime = 25 * 60;
            setTimeToNextAreaReduction(prevTime => {
                if (prevTime <= 0) return nextAreaTime;
                return prevTime - 1;
            });
        }, 1000);

        return () => {
            clearInterval(locationInterval);
            clearInterval(hintInterval);
            clearInterval(areaInterval);
        };
    }, [updatePlayerLocation]);

    const handleSubmitHint = async () => {
        if (!hint.trim()) return;
        await addHint(hint);
        setHint('');
    };

    if (!game) return null;

    const isSelectedPlayer = game.selectedPlayer === 'current-user-id'; // You'll need to implement proper user ID checking

    return (
        <IonContent>
            <MapContainer
                center={game.currentArea.center}
                zoom={13}
                style={{ height: '70vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Circle
                    center={game.currentArea.center}
                    radius={game.currentArea.radius}
                    color="red"
                />
                {/* Show markers for team members if not selected player */}
                {!isSelectedPlayer && game.players.map((player: Player) => (
                    player.location && (
                        <Marker key={player.id} position={player.location} />
                    )
                ))}
            </MapContainer>

            <IonList>
                {isSelectedPlayer && (
                    <>
                        <IonItem>
                            <IonLabel>Next hint in: {Math.floor(timeToNextHint / 60)}:{(timeToNextHint % 60).toString().padStart(2, '0')}</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonInput
                                value={hint}
                                placeholder="Enter your hint..."
                                onIonChange={e => setHint(e.detail.value || '')}
                            />
                            <IonButton 
                                slot="end"
                                onClick={handleSubmitHint}
                                disabled={timeToNextHint > 0}
                            >
                                Send Hint
                            </IonButton>
                        </IonItem>
                    </>
                )}

                <IonItem>
                    <IonLabel>
                        Area reduces in: {Math.floor(timeToNextAreaReduction / 60)}:{(timeToNextAreaReduction % 60).toString().padStart(2, '0')}
                    </IonLabel>
                </IonItem>

                <IonItem>
                    <IonLabel>Recent Hints</IonLabel>
                </IonItem>
                {game.hints.map((hint: Hint, index: number) => (
                    <IonItem key={index}>
                        <IonText>
                            {new Date(hint.time).toLocaleTimeString()}: {hint.message}
                        </IonText>
                    </IonItem>
                ))}
            </IonList>

            {isSelectedPlayer && (
                <ImageUpload 
                    onImageSelected={(imageUrl) => addHint(hint, imageUrl)}
                />
            )}

            <TeamChat />
        </IonContent>
    );
};

export default GameRunning; 