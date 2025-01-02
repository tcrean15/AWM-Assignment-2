import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonItem, IonLabel, IonList, IonInput, IonButton } from '@ionic/react';

interface ChatMessage {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

interface GameChatProps {
  gameId: number;
  websocket: WebSocket | null;
}

const GameChat: React.FC<GameChatProps> = ({ gameId, websocket }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load chat history
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/chat/`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, [gameId]);

  useEffect(() => {
    if (websocket) {
      websocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
        }
      });
    }
  }, [websocket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && websocket) {
      websocket.send(JSON.stringify({
        type: 'chat_message',
        message: newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  return (
    <div className="game-chat">
      <div className="chat-messages" style={{ height: '300px', overflowY: 'auto' }}>
        <IonList>
          {messages.map((msg) => (
            <IonItem key={msg.id}>
              <IonLabel>
                <h3>{msg.username}</h3>
                <p>{msg.content}</p>
                <p className="time-stamp">{new Date(msg.created_at).toLocaleString()}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-input">
        <IonItem>
          <IonInput
            value={newMessage}
            placeholder="Type a message..."
            onIonChange={e => setNewMessage(e.detail.value || '')}
          />
          <IonButton type="submit" disabled={!newMessage.trim()}>
            Send
          </IonButton>
        </IonItem>
      </form>
    </div>
  );
};

export default GameChat; 