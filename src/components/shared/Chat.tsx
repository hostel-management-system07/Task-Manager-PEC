import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface ChatProps {
  type: 'project' | 'private';
  projectId?: string;
  receiverId?: string;
  receiverName?: string;
}

interface Message {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  timestamp: any;
}

export function Chat({ type, projectId, receiverId, receiverName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { userData } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userData) return;

    const collectionName = type === 'project' ? 'projectChats' : 'privateChats';
    let q;

    if (type === 'project' && projectId) {
      q = query(
        collection(db, collectionName),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'asc')
      );
    } else if (type === 'private' && receiverId) {
      q = query(
        collection(db, collectionName),
        orderBy('timestamp', 'asc')
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Filter private messages to show only conversations between current user and receiver
      if (type === 'private') {
        messagesData = messagesData.filter(msg => 
          (msg.senderId === userData.uid && msg.receiverId === receiverId) ||
          (msg.senderId === receiverId && msg.receiverId === userData.uid)
        );
      }

      setMessages(messagesData);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [type, projectId, receiverId, userData]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData) return;

    try {
      const collectionName = type === 'project' ? 'projectChats' : 'privateChats';
      const messageData: any = {
        message: newMessage,
        senderId: userData.uid,
        senderName: userData.displayName,
        timestamp: new Date()
      };

      if (type === 'project' && projectId) {
        messageData.projectId = projectId;
      } else if (type === 'private' && receiverId) {
        messageData.receiverId = receiverId;
      }

      await addDoc(collection(db, collectionName), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === 'project' ? 'Project Chat' : `Chat with ${receiverName || 'User'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === userData?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === userData?.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.senderId !== userData?.uid && (
                    <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp?.toDate?.()?.toLocaleTimeString() || ''}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
