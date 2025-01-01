import React from 'react';
import { IonButton } from '@ionic/react';
import { useHistory } from 'react-router';
import { API_URL } from '../config';

interface LogoutButtonProps {
    slot?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ slot }) => {
    const history = useHistory();

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/logout/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                // Clear any local storage items if needed
                localStorage.removeItem('user');
                history.push('/login');
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <IonButton onClick={handleLogout} color="danger">
            Logout
        </IonButton>
    );
};

export default LogoutButton; 