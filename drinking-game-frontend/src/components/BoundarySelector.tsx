import React, { useEffect, useRef } from 'react';
import { IonContent, IonButton } from '@ionic/react';
import { MapContainer, Circle, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../contexts/GameContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// MapController component to handle map interactions
const MapController: React.FC<{
    onMapClick: (e: L.LeafletMouseEvent) => void
}> = ({ onMapClick }) => {
    const map = useMap();

    useEffect(() => {
        if (map) {
            map.on('click', onMapClick);
            // Get user's location and center map
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 15);
            });
        }

        return () => {
            map.off('click', onMapClick);
        };
    }, [map, onMapClick]);

    return null;
};

const BoundarySelector: React.FC = () => {
    const { game, setBoundary, isHost } = useGame();

    const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (!isHost) return;
        
        const { lat, lng } = e.latlng;
        const radius = 500; // Default radius of 500 meters
        
        setBoundary([lat, lng], radius);
    };

    return (
        <IonContent>
            <div style={{ height: '100vh', width: '100%' }}>
                <MapContainer
                    center={[51.505, -0.09]} // Default center
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController onMapClick={handleMapClick} />
                    {game?.boundary && (
                        <Circle
                            center={game.boundary.center}
                            radius={game.boundary.radius}
                            color="red"
                        />
                    )}
                </MapContainer>
            </div>
            {isHost && (
                <IonButton 
                    expand="block"
                    disabled={!game?.boundary}
                    onClick={() => game?.boundary && setBoundary(game.boundary.center, game.boundary.radius)}
                    style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
                >
                    Confirm Boundary
                </IonButton>
            )}
        </IonContent>
    );
};

export default BoundarySelector; 