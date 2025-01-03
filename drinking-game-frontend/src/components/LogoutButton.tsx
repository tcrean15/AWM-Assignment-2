import React from 'react';
import { IonButton, useIonToast } from '@ionic/react';
import { ApiService } from '../services/api.service';
import { useHistory } from 'react-router-dom';

const LogoutButton: React.FC = () => {
    const [present] = useIonToast();
    const history = useHistory();

    const handleLogout = () => {
        try {
            // Call the logout method from ApiService
            ApiService.logout();
            
            present({
                message: 'Successfully logged out',
                duration: 2000,
                color: 'success'
            });

            // Redirect to login page
            history.push('/login');
            
        } catch (error) {
            present({
                message: 'Failed to logout',
                duration: 2000,
                color: 'danger'
            });
        }
    };

    return (
        <IonButton 
            onClick={handleLogout}
            color="medium"
            fill="solid"
        >
            Logout
        </IonButton>
    );
};

export default LogoutButton; 