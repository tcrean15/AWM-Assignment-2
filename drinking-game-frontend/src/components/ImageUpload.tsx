import React, { useState } from 'react';
import { IonButton, IonImg, IonSpinner } from '@ionic/react';
import { Camera, CameraResultType } from '@capacitor/camera';

interface ImageUploadProps {
    onImageSelected: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const takePicture = async () => {
        try {
            setLoading(true);
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Base64
            });

            if (image.base64String) {
                const imageUrl = `data:image/jpeg;base64,${image.base64String}`;
                setPreview(imageUrl);
                onImageSelected(imageUrl);
            }
        } catch (error) {
            console.error('Error taking picture:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {loading && <IonSpinner />}
            {preview && <IonImg src={preview} />}
            <IonButton onClick={takePicture} disabled={loading}>
                Take Picture
            </IonButton>
        </div>
    );
};

export default ImageUpload; 