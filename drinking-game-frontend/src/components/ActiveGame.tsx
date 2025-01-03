import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonModal,
    IonInput,
    useIonToast
} from '@ionic/react';
import { MapContainer, TileLayer, Circle, Marker, ZoomControl } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { peopleOutline, walletOutline, locationOutline, personOutline, removeCircleOutline } from 'ionicons/icons';
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
    kitty_value_per_player: number;
}

interface ActiveGameProps {
    game: any;
    onGameUpdate?: () => void;
}

const ActiveGame: React.FC<ActiveGameProps> = ({ game, onGameUpdate }) => {
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSubtractModal, setShowSubtractModal] = useState(false);
    const [subtractAmount, setSubtractAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
    const [present] = useIonToast();
    const [map, setMap] = useState<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Initialize center and radius with default values
    const defaultCenter: [number, number] = [53.3498, -6.2603];
    const defaultRadius = 500;

    // Parse coordinates from game data
    const parseGameCenter = (game: any): [number, number] => {
        if (game.center && game.center.coordinates) {
            // Convert from [lng, lat] to [lat, lng]
            return [game.center.coordinates[1], game.center.coordinates[0]];
        }
        return [53.3498, -6.2603]; // Default coordinates
    };

    // Get center coordinates
    const center = parseGameCenter(game);
    const radius = game.radius || 500;

    // Handle map initialization
    const handleMapCreated = (newMap: L.Map) => {
        mapRef.current = newMap;
        setMap(newMap);
        setIsMapReady(true);
    };

    // Initial map setup
    useEffect(() => {
        if (isMapReady && mapRef.current && mapContainerRef.current) {
            const map = mapRef.current;
            
            const initializeMap = () => {
                // Force immediate size updates
                map.invalidateSize(true);
                
                // Get current center from game data
                const currentCenter = parseGameCenter(game);
                
                // Set bounds and zoom
                const bounds = new L.LatLngBounds([
                    [currentCenter[0] - 0.01, currentCenter[1] - 0.01],
                    [currentCenter[0] + 0.01, currentCenter[1] + 0.01]
                ]);
                map.fitBounds(bounds);
                
                // Force another update after a short delay
            setTimeout(() => {
                    map.invalidateSize(true);
                    map.fitBounds(bounds);
                }, 250);
            };

            initializeMap();
            
            // Set up resize observer
            const resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => initializeMap());
            });

            resizeObserver.observe(mapContainerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [isMapReady, game, center]); // Add game to dependencies

    const handleGetLocation = useCallback(async () => {
        try {
            // Show loading toast
            present({
                message: 'Getting your location...',
                duration: 2000,
                color: 'primary'
            });

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

            if (position && position.coords) {
                const { latitude, longitude } = position.coords;
                console.log('Got current location:', { latitude, longitude });
                
                // Update player location
                const newLocation: [number, number] = [latitude, longitude];
                setCurrentLocation(newLocation);
                
                // Center map on current location
                if (mapRef.current) {
                    console.log('Centering map on:', newLocation);
                    mapRef.current.setView(newLocation, 15, {
                        animate: true,
                        duration: 1
                    });
                    mapRef.current.invalidateSize(true);
                } else {
                    console.warn('Map reference not available');
                }

                // Show success message
                present({
                    message: 'Location updated successfully',
                    duration: 2000,
                    color: 'success'
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
            present({
                message: 'Failed to get location. Please check your location permissions.',
                duration: 3000,
                color: 'danger'
            });
        }
    }, [present]);

    // Add useEffect to request location permissions early
    useEffect(() => {
        const requestLocationPermission = async () => {
            try {
                const permissionStatus = await Geolocation.checkPermissions();
                if (permissionStatus.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }
            } catch (error) {
                console.error('Error requesting location permission:', error);
            }
        };

        requestLocationPermission();
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
            present({
                message: 'Game ended successfully',
                duration: 2000,
                color: 'success'
            });
            
            // Update game state
            if (onGameUpdate) {
                await onGameUpdate();
            }
        } catch (error: any) {
            present({
                message: error.message || 'Failed to end game',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const isHuntedPlayer = () => {
        const player = game.players.find(p => p.user?.id === currentUser?.id);
        return player?.team === 0;
    };

    const handleSubtractFromKitty = async () => {
        try {
            const amount = parseFloat(subtractAmount);
            if (isNaN(amount) || amount <= 0) {
                present({
                    message: 'Please enter a valid amount',
                    duration: 2000,
                    color: 'warning'
                });
                return;
            }

            setShowConfirmation(true);
        } catch (error: any) {
            present({
                message: error.message || 'Failed to subtract from kitty',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const confirmSubtraction = async () => {
        try {
            setIsLoading(true);
            const amount = parseFloat(subtractAmount);
            
            const response = await ApiService.subtractFromKitty(game.id, amount);
            
            // Show success message
            present({
                message: response.message || 'Successfully subtracted from kitty',
                duration: 2000,
                color: 'success'
            });

            // If game ended, show game over sequence
            if (response.game_ended) {
                setShowGameOverModal(true);
            }

            // Update the game state
            if (onGameUpdate) {
                await onGameUpdate();
            }

            // Reset states
                setShowConfirmation(false);
                setShowSubtractModal(false);
                setSubtractAmount('');
                setIsLoading(false);

        } catch (error: any) {
            setIsLoading(false);
            present({
                message: error.message || 'Failed to subtract from kitty',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    const getKittyColor = (total: number) => {
        if (total <= 0) return 'danger';
        if (total <= 10) return 'warning';
        return 'success';
    };

    // Add polling for game status
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const updatedGame = await ApiService.getGame(game.id);
                if (updatedGame.status === 'FINISHED') {
                    if (onGameUpdate) {
                        await onGameUpdate();
                    }
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Error polling game status:', error);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [game.id, onGameUpdate]);

    const handleGameOver = () => {
        setShowGameOverModal(true);
        
        // Show appropriate message based on team
        const player = game.players.find(p => p.user.id === currentUser.id);
        const isHunted = player?.team === 0;
        
        present({
            message: isHunted 
                ? 'Game Over! Your team has won by depleting the kitty!'
                : 'Game Over! The Hunted team has won by depleting the kitty!',
            duration: 5000,
            position: 'middle',
            color: isHunted ? 'success' : 'warning',
            buttons: [
                {
                    text: 'Return Home',
                    handler: () => {
                        window.location.href = '/home';
                    }
                }
            ]
        });

        // Redirect after 6 seconds
        setTimeout(() => {
            window.location.href = '/home';
        }, 6000);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Active Game</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Game Status</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonItem lines="none">
                                        <IonIcon icon={walletOutline} slot="start" />
                                        <IonLabel color={getKittyColor(parseFloat(game.total_kitty))}>
                                            Total Kitty: €{game.total_kitty}
                                        </IonLabel>
                                        {isHuntedPlayer() && game.total_kitty > 0 && (
                                            <IonButton
                                                slot="end"
                                                fill="clear"
                                                onClick={() => setShowSubtractModal(true)}
                                            >
                                                <IonIcon icon={removeCircleOutline} />
                                            </IonButton>
                                        )}
                                    </IonItem>
                                    
                                    <IonItem lines="none">
                                        <IonIcon icon={peopleOutline} slot="start" />
                                        <IonLabel>Players: {game.players.length}</IonLabel>
                                    </IonItem>
                                </IonCardContent>
                            </IonCard>

                            <IonCard className="map-card">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={locationOutline} /> Game Area
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <div className="map-wrapper" ref={mapContainerRef}>
                                        <MapContainer 
                                            center={center} 
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                            whenCreated={handleMapCreated}
                                            zoomControl={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            />
                                                <Circle
                                                    center={center}
                                                    radius={radius}
                                                pathOptions={{
                                                    color: '#ff4961',
                                                    fillColor: '#ff4961',
                                                    fillOpacity: 0.2,
                                                    weight: 2
                                                }}
                                            />
                                            <ZoomControl position="topright" />
                                            {currentLocation && (
                                                <Marker
                                                    position={currentLocation}
                                                    icon={L.divIcon({
                                                        className: 'current-player-marker',
                                                        iconSize: [12, 12]
                                                    })}
                                                />
                                            )}
                                        </MapContainer>
                                        <IonButton 
                                            className="location-button"
                                            onClick={handleGetLocation}
                                        >
                                            <IonIcon slot="start" icon={locationOutline} />
                                            Get Location
                                        </IonButton>
                                    </div>
                                </IonCardContent>
                            </IonCard>

                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={peopleOutline} /> Teams
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <div className="teams-container">
                                        <div className="team-section hunted">
                                            <h3>
                                                <IonIcon icon={personOutline} color="danger" />
                                                Hunted Team
                                            </h3>
                                            <div className="team-players">
                                                {playersByTeam['Hunted']?.map(player => renderPlayer(player))}
                                                {!playersByTeam['Hunted']?.length && 
                                                    <div className="player-item">No players assigned yet</div>
                                                }
                                            </div>
                                        </div>

                                        <div className="team-section hunters">
                                            <h3>
                                                <IonIcon icon={peopleOutline} color="primary" />
                                                Hunters Teams
                                            </h3>
                                            <div className="team-players">
                                                {playersByTeam['Hunters Team 1']?.length > 0 && (
                                                    <div className="hunter-team">
                                                        <h4>Team 1</h4>
                                                        <div className="team-players">
                                                            {playersByTeam['Hunters Team 1']?.map(player => renderPlayer(player))}
                                                        </div>
                                                    </div>
                                                )}
                                                {playersByTeam['Hunters Team 2']?.length > 0 && (
                                                    <div className="hunter-team">
                                                        <h4>Team 2</h4>
                                                        <div className="team-players">
                                                            {playersByTeam['Hunters Team 2']?.map(player => renderPlayer(player))}
                                                        </div>
                                                    </div>
                                                )}
                                                {!playersByTeam['Hunters Team 1']?.length && !playersByTeam['Hunters Team 2']?.length && 
                                                    <div className="player-item">No hunters assigned yet</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>

                            <IonGrid>
                                <IonRow className="ion-justify-content-between ion-margin-top">
                                    <IonCol size="auto">
                                        <LogoutButton />
                                    </IonCol>
                                    <IonCol size="auto">
                                        {game.host.id === currentUser.id && (
                                            <IonButton 
                                                onClick={() => setShowEndGameConfirm(true)} 
                                                color="danger"
                                                expand="block"
                                                className="ion-margin-top"
                                            >
                                                End Game
                                            </IonButton>
                                        )}
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                <IonModal isOpen={showSubtractModal} onDidDismiss={() => setShowSubtractModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Subtract from Kitty</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowSubtractModal(false)}>Close</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <div className="ion-padding">
                                        <IonInput
                                            type="number"
                                            value={subtractAmount}
                                            onIonChange={e => setSubtractAmount(e.detail.value!)}
                                            placeholder="Enter amount"
                                        />
                                    <IonButton
                                        expand="block"
                                        onClick={handleSubtractFromKitty}
                                disabled={isLoading || !subtractAmount}
                                    >
                                Subtract
                                    </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                <IonModal isOpen={showConfirmation} onDidDismiss={() => setShowConfirmation(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Confirm Subtraction</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <div className="ion-padding">
                            <p>Are you sure you want to subtract {subtractAmount} from the kitty?</p>
                                    <IonButton
                                        expand="block"
                                        onClick={confirmSubtraction}
                                        disabled={isLoading}
                                    >
                                Confirm
                                    </IonButton>
                                    <IonButton
                                        expand="block"
                                fill="outline"
                                        onClick={() => setShowConfirmation(false)}
                                        disabled={isLoading}
                                    >
                                Cancel
                                    </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                {/* Game Over Modal */}
                <IonModal isOpen={showGameOverModal} backdropDismiss={false}>
                    <IonContent className="ion-padding">
                        <div className="game-over-container">
                            <h1>Game Over!</h1>
                            {game.players.find(p => p.user.id === currentUser.id)?.team === 0 ? (
                                <p>Congratulations! Your team has won by depleting the kitty!</p>
                            ) : (
                                <p>The Hunted team has won by depleting the kitty!</p>
                            )}
                            <p>You will be redirected to the home page...</p>
                            <IonButton 
                                expand="block"
                                onClick={() => window.location.href = '/home'}
                            >
                                Return Home Now
                            </IonButton>
                        </div>
                    </IonContent>
                </IonModal>

                {/* End Game Confirmation Modal */}
                <IonModal isOpen={showEndGameConfirm} onDidDismiss={() => setShowEndGameConfirm(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>End Game</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowEndGameConfirm(false)}>
                                    Cancel
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <h2>Are you sure you want to end the game?</h2>
                        <p>This will end the game for all players.</p>
                        <IonButton
                            expand="block"
                            color="danger"
                            onClick={handleEndGame}
                        >
                            Yes, End Game
                        </IonButton>
                        <IonButton
                            expand="block"
                            color="medium"
                            onClick={() => setShowEndGameConfirm(false)}
                            className="ion-margin-top"
                        >
                            Cancel
                        </IonButton>
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default ActiveGame; 