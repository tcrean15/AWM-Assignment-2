import React, { useEffect, useState } from 'react';
import { IonContent, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ActiveGame.css';
import { ApiService } from '../services/api.service';
import LogoutButton from './LogoutButton';
import { GamePlayer } from '../types/game';

interface Player {
    id?: number;
    user?: {
        id: number;
        username: string;
    } | null;
    username?: string;
    team: number;
    location?: [number, number];
}

interface GameData {
    id: number;
    host: {
        id: number;
        username: string;
    };
    players: Player[];
    current_area: string;
    radius: number;
    status: string;
    hunted_team: number;
    center?: [number, number];
}

interface ActiveGameProps {
    game: GameData;
    currentUser: {
        id: number;
        username: string;
    };
}

const ActiveGame: React.FC<ActiveGameProps> = ({ game, currentUser }) => {
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Parse the polygon coordinates from the SRID string
    const parsePolygonCoordinates = (polygonStr: string | undefined): [number, number] => {
        if (!polygonStr) {
            // Use the coordinates that were set during game setup
            return game.center || [53.3498, -6.2603];
        }

        try {
            console.log('Parsing polygon string:', polygonStr);
            const cleanStr = polygonStr.replace('SRID=4326;', '');
            const matches = cleanStr.match(/POLYGON \(\((.*?)\)\)/);
            
            if (matches && matches[1]) {
                // Get first coordinate pair
                const firstCoordPair = matches[1].split(',')[0].trim();
                const [lon, lat] = firstCoordPair.split(' ').map(Number);
                return [lat, lon];
            }
        } catch (error) {
            console.error('Error parsing coordinates:', error);
        }
        
        // Fallback to game center or default coordinates
        return game.center || [53.3498, -6.2603];
    };

    const center = parsePolygonCoordinates(game.current_area);
    const radius = game.radius || 500; // Use game radius or default to 500m

    useEffect(() => {
        let watchId: string;

        const startWatchingPosition = async () => {
            try {
                const initialPosition = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 30000
                });

                setCurrentLocation([
                    initialPosition.coords.latitude,
                    initialPosition.coords.longitude
                ]);

                watchId = await Geolocation.watchPosition(
                    {
                        enableHighAccuracy: true,
                        timeout: 30000
                    },
                    (position) => {
                        if (position) {
                            setCurrentLocation([
                                position.coords.latitude,
                                position.coords.longitude
                            ]);
                            setError(null);
                        }
                    }
                );
            } catch (error: any) {
                console.error('Error getting location:', error);
                setError(`Location error: ${error.message}`);
            }
        };

        startWatchingPosition();

        return () => {
            if (watchId) {
                Geolocation.clearWatch({ id: watchId });
            }
        };
    }, []);

    // Group players by team
    const playersByTeam = game.players.reduce((acc, player) => {
        const teamName = player.team_name || 'Unknown';
        if (!acc[teamName]) {
            acc[teamName] = [];
        }
        acc[teamName].push(player);
        return acc;
    }, {} as Record<string, GamePlayer[]>);

    const renderPlayer = (player: GamePlayer) => {
        const isHost = player.user.id === game.host.id;
        const isCurrentUser = player.user.id === currentUser.id;
        return (
            <div key={player.id} className={`player-item ${isCurrentUser ? 'current-user' : ''}`}>
                {player.username}
                {isHost && ' (Host)'}
                {isCurrentUser && ' (You)'}
            </div>
        );
    };

    const handleEndGame = async () => {
        try {
            await ApiService.endGame(game.id);
        } catch (error) {
            console.error('Failed to end game:', error);
        }
    };

    return (
        <div className="active-game-container">
            <div className="map-wrapper">
                <MapContainer center={center} zoom={15}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {center && (
                        <Circle
                            center={center}
                            radius={radius}
                            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
                        />
                    )}
                    {currentLocation && (
                        <Marker
                            position={currentLocation}
                            icon={L.divIcon({
                                className: 'current-player-marker',
                                html: `<div>You</div>`
                            })}
                        />
                    )}
                </MapContainer>
            </div>

            <div className="game-controls">
                <div className="teams-container">
                    {/* Hunted Team */}
                    <div className="team-section hunted">
                        <h3>Hunted Team</h3>
                        <div className="team-players">
                            {playersByTeam['Hunted']?.map(player => renderPlayer(player))}
                            {!playersByTeam['Hunted'] && <div>No hunted player assigned</div>}
                        </div>
                    </div>

                    {/* Hunters Teams */}
                    <div className="team-section hunters">
                        <h3>Hunters Teams</h3>
                        <div className="team-players">
                            {playersByTeam['Hunters Team 1']?.map(player => (
                                <div key={player.id} className="hunter-team">
                                    <h4>Team 1</h4>
                                    {renderPlayer(player)}
                                </div>
                            ))}
                            {playersByTeam['Hunters Team 2']?.map(player => (
                                <div key={player.id} className="hunter-team">
                                    <h4>Team 2</h4>
                                    {renderPlayer(player)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <IonGrid>
                <IonRow className="ion-justify-content-between ion-margin-top">
                    <IonCol size="auto">
                        <LogoutButton />
                    </IonCol>
                    <IonCol size="auto">
                        <IonButton 
                            onClick={handleEndGame} 
                            color="danger"
                            disabled={!game.id || game.status === 'FINISHED'}
                        >
                            End Game
                        </IonButton>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </div>
    );
};

export default ActiveGame; 