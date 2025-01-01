import React, { useEffect, useState } from 'react';
import { IonContent, IonButton } from '@ionic/react';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ActiveGame.css';

// Define interfaces first
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
}

interface ActiveGameProps {
    game: GameData;
    currentUser: {
        id: number;
        username: string;
    };
}

const ActiveGame: React.FC<ActiveGameProps> = ({ game, currentUser }) => {
    // Move debug logging here
    console.log('Full game data:', {
        game,
        host: game.host,
        players: game.players,
        currentUser
    });

    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Parse the polygon coordinates from the SRID string
    const parsePolygonCoordinates = (polygonStr: string | undefined): [number, number] => {
        if (!polygonStr) return [53.3498, -6.2603];

        try {
            console.log('Parsing polygon string:', polygonStr);
            const cleanStr = polygonStr.replace('SRID=4326;', '');
            const matches = cleanStr.match(/POLYGON \(\((.*?)\)\)/);
            
            if (matches && matches[1]) {
                // Get first coordinate pair
                const firstCoordPair = matches[1].split(',')[0].trim();
                const [lon, lat] = firstCoordPair.split(' ').map(Number);
                
                // Create center point
                const center: [number, number] = [lat, lon];
                console.log('Parsed center coordinates:', center);
                return center;
            }
        } catch (error) {
            console.error('Error parsing coordinates:', error);
        }
        
        return [53.3498, -6.2603];
    };

    const defaultCenter: [number, number] = [53.3498, -6.2603];
    const center: [number, number] = game.current_area ? 
        parsePolygonCoordinates(game.current_area) : 
        defaultCenter;

    console.log('Game data:', game);
    console.log('Current area:', game.current_area);
    console.log('Center coordinates:', center);

    const containerStyle = {
        height: '100vh',
        width: '100%',
        position: 'relative' as const
    };

    useEffect(() => {
        let watchId: string;

        const startWatchingPosition = async () => {
            try {
                // First get initial position
                const initialPosition = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 30000
                });

                setCurrentLocation([
                    initialPosition.coords.latitude,
                    initialPosition.coords.longitude
                ]);

                // Then start watching
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

    // Add debug logging
    console.log('Game data received:', game);
    console.log('Players:', game.players);

    const getPlayerName = (player: any) => {
        // If this player is the host
        if (player.user?.id === game.host.id) {
            return `${game.host.username} (Host)`;
        }

        // If this player is the current user
        if (player.user?.id === currentUser.id) {
            return `${currentUser.username} (You)`;
        }

        // If player has a user object with username
        if (player.user?.username) {
            return player.user.username;
        }

        // If we can't determine the name
        return `Player ${player.team + 1}`;
    };

    const getTeamName = (teamNumber: number) => {
        return teamNumber === game.hunted_team ? 'Hunted' : 'Hunters';
    };

    return (
        <div className="active-game-container">
            <div className="map-wrapper">
                <MapContainer
                    center={center}
                    zoom={15}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {game.current_area && (
                        <Circle
                            center={center}
                            radius={game.radius || 500}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                        />
                    )}

                    {/* Player markers */}
                    {Array.isArray(game.players) && game.players.map(player => {
                        if (!player?.location) return null;
                        const playerName = getPlayerName(player);
                        
                        return (
                            <Marker
                                key={player.id}
                                position={player.location}
                                icon={L.divIcon({
                                    className: `player-marker team-${player.team}`,
                                    html: `<div>${playerName}</div>`
                                })}
                            />
                        );
                    })}

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
                <h3>Game Status</h3>
                <div className="team-status">
                    <div className="team-info hunted">
                        <h4>Hunted Team</h4>
                        <div className="team-players">
                            {game.players
                                .filter(p => p.team === game.hunted_team)
                                .map((player, index) => (
                                    <div key={player.id || index} className="player-name">
                                        {getPlayerName(player)}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                    <div className="team-info hunters">
                        <h4>Hunters Team</h4>
                        <div className="team-players">
                            {game.players
                                .filter(p => p.team !== game.hunted_team)
                                .map((player, index) => (
                                    <div key={player.id || index} className="player-name">
                                        {getPlayerName(player)}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-list">
                <h3>Players ({game.players.length})</h3>
                {Array.isArray(game.players) && game.players.map((player, index) => {
                    const playerName = getPlayerName(player);
                    const team = player.team ?? '-';
                    const isCurrentUser = player.user?.id === currentUser.id;
                    const teamRole = getTeamName(team);
                    
                    return (
                        <div 
                            key={player.id || index} 
                            className={`player-item team-${team} ${isCurrentUser ? 'current-player' : ''}`}
                        >
                            {playerName} - {teamRole}
                        </div>
                    );
                })}
            </div>
            
            {error && (
                <div className="error-message">{error}</div>
            )}
        </div>
    );
};

export default ActiveGame; 