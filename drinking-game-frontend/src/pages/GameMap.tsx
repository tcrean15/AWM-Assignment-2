import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { ApiService } from '../services/api.service';
import './GameMap.css';
import { useParams } from 'react-router-dom';

interface CustomGeolocationPosition {
    coords: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    }
}

const GameMap: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const [position, setPosition] = useState<[number, number]>([0, 0]);
    const [players, setPlayers] = useState<any[]>([]);

    useEffect(() => {
        startLocationTracking();
    }, []);

    const startLocationTracking = async () => {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            setPosition([coordinates.coords.latitude, coordinates.coords.longitude]);

            // Watch for location changes
            await Geolocation.watchPosition({
                enableHighAccuracy: true,
                timeout: 1000,
                maximumAge: 3000,
            }, (position) => {
                if (position) {
                    setPosition([position.coords.latitude, position.coords.longitude]);
                    // Update server with new position
                    updateServerPosition(position.coords);
                }
            });
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const updateServerPosition = async (coords: { latitude: number; longitude: number }) => {
        try {
            if (!gameId) {
                console.error('No game ID available');
                return;
            }
            await ApiService.updateLocation(Number(gameId), coords.latitude, coords.longitude);
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Game Map</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {players.map(player => (
                        <Marker 
                            key={player.id} 
                            position={[player.location.lat, player.location.lng]}
                        >
                            <Popup>{player.username}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </IonContent>
        </IonPage>
    );
};

export default GameMap; 