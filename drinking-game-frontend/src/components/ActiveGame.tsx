import React, { useEffect, useState } from 'react';
import { IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { camera } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ActiveGameProps {
    game: any;
    currentUser: any;
}

// Component to handle map updates
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    
    return null;
};

const ActiveGame: React.FC<ActiveGameProps> = ({ game, currentUser }) => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        const getCurrentPosition = async () => {
            try {
                const coordinates = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true
                });
                const position: [number, number] = [
                    coordinates.coords.latitude,
                    coordinates.coords.longitude
                ];
                setUserLocation(position);
                setMapLoaded(true);
            } catch (error) {
                console.error("Error getting location:", error);
                setError('Error getting location');
            }
        };

        getCurrentPosition();

        // Start watching player location
        let watchId: string;
        
        const watchPosition = async () => {
            try {
                watchId = await Geolocation.watchPosition({
                    enableHighAccuracy: true,
                    timeout: 1000,
                    maximumAge: 3000,
                }, (position) => {
                    if (position) {
                        const newLocation: [number, number] = [
                            position.coords.latitude,
                            position.coords.longitude
                        ];
                        setUserLocation(newLocation);
                    }
                });
            } catch (error) {
                setError('Error watching location');
                console.error(error);
            }
        };

        watchPosition();

        return () => {
            if (watchId) {
                Geolocation.clearWatch({ id: watchId });
            }
        };
    }, []);

    const createTeamIcon = (team: string) => {
        return L.divIcon({
            className: `team-marker team-${team}`,
            html: `<div style="background-color: ${team === 'red' ? '#ff4444' : '#4444ff'}; 
                                width: 10px; 
                                height: 10px; 
                                border-radius: 50%;
                                border: 2px solid white"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
    };

    if (!mapLoaded || !userLocation) {
        return <div>Loading map...</div>;
    }

    return (
        <IonContent className="ion-padding" style={{ height: '100vh' }}>
            <MapContainer
                center={userLocation}
                zoom={15}
                style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                whenReady={() => setMapLoaded(true)}
            >
                <MapController center={userLocation} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Current player location */}
                <Marker position={userLocation} />
                
                {/* Game area */}
                {game?.current_area && (
                    <Circle
                        center={[
                            game.current_area.coordinates[0][0][1],
                            game.current_area.coordinates[0][0][0]
                        ]}
                        radius={game.current_area.radius}
                        pathOptions={{ color: 'blue', fillColor: 'blue' }}
                    />
                )}

                {/* Other players from same team */}
                {game?.players
                    .filter((player: any) => 
                        player.team === game.currentPlayer?.team && 
                        player.id !== game.currentPlayer?.id)
                    .map((player: any) => (
                        player.location && (
                            <Marker
                                key={player.id}
                                position={[player.location.lat, player.location.lng]}
                                icon={createTeamIcon(player.team)}
                            />
                        )
                    ))
                }
            </MapContainer>

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton onClick={() => {/* Handle taking photo */}}>
                    <IonIcon icon={camera} />
                </IonFabButton>
            </IonFab>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </IonContent>
    );
};

export default ActiveGame; 