import React, { useState, useEffect } from 'react';
import { IonButton, IonRange, IonItem, IonLabel } from '@ionic/react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AreaSelector.css';

interface AreaSelectorProps {
    onAreaConfirmed: (center: [number, number], radius: number) => void;
}

// Map controller component to handle map interactions
const MapController: React.FC<{
    center: [number, number];
    onLocationSelect: (lat: number, lng: number) => void;
}> = ({ center, onLocationSelect }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, 13);
        map.on('click', (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        });

        return () => {
            map.off('click');
        };
    }, []);

    return null;
};

const AreaSelector: React.FC<AreaSelectorProps> = ({ onAreaConfirmed }) => {
    const [center, setCenter] = useState<[number, number]>([53.3498, -6.2603]);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [radius, setRadius] = useState(500);

    useEffect(() => {
        const getCurrentLocation = async () => {
            try {
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                });
                
                const newCenter: [number, number] = [
                    position.coords.latitude,
                    position.coords.longitude
                ];
                setCenter(newCenter);
                setSelectedLocation(newCenter);
            } catch (error) {
                console.error('Error getting location:', error);
            }
        };

        getCurrentLocation();
    }, []);

    const handleLocationSelect = (lat: number, lng: number) => {
        setSelectedLocation([lat, lng]);
    };

    return (
        <div className="area-selector-container">
            <div className="map-wrapper">
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController 
                        center={center}
                        onLocationSelect={handleLocationSelect}
                    />
                    {selectedLocation && (
                        <Circle
                            center={selectedLocation}
                            radius={radius}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                        />
                    )}
                </MapContainer>
            </div>
            
            <div className="controls-container">
                <IonItem>
                    <IonLabel>Area Radius</IonLabel>
                    <IonLabel slot="end">{radius} meters</IonLabel>
                    <IonRange
                        min={100}
                        max={2000}
                        step={100}
                        value={radius}
                        onIonChange={e => setRadius(e.detail.value as number)}
                    />
                </IonItem>
            </div>

            <div className="button-container">
                <IonButton 
                    expand="block"
                    onClick={() => selectedLocation && onAreaConfirmed(selectedLocation, radius)}
                    disabled={!selectedLocation}
                    className="confirm-button"
                >
                    Confirm Area
                </IonButton>
            </div>
        </div>
    );
};

export default AreaSelector; 