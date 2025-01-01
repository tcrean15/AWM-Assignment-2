import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonFooter, IonToolbar } from '@ionic/react';
import { useGame } from '../contexts/GameContext';

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

const TeamChat: React.FC = () => {
    const { game } = useGame();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const contentRef = useRef<HTMLIonContentElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (contentRef.current) {
            contentRef.current.scrollToBottom(300);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        // Here you would typically send the message to your backend
        // For now, we'll just add it locally
        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: 'current-user-id', // Replace with actual user ID
            text: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');
    };

    return (
        <>
            <IonContent ref={contentRef}>
                <IonList>
                    {messages.map(msg => (
                        <IonItem key={msg.id}>
                            <IonLabel>
                                <h3>{msg.senderId === 'current-user-id' ? 'You' : 'Team Member'}</h3>
                                <p>{msg.text}</p>
                                <p className="timestamp">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <IonItem>
                        <IonInput
                            value={message}
                            placeholder="Type a message..."
                            onIonChange={e => setMessage(e.detail.value || '')}
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        />
                        <IonButton slot="end" onClick={sendMessage}>
                            Send
                        </IonButton>
                    </IonItem>
                </IonToolbar>
            </IonFooter>
        </>
    );
};

export default TeamChat; 