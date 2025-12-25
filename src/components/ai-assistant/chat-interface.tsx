
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { type AiAssistantFlowOutput } from '@/types/ai-flows';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mic, User, Bot, Loader2, StopCircle, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { ActionConfirmationDialog } from './action-confirmation-dialog';
import { PinModal } from '../auth/pin-modal';
import { useNotifications } from '@/context/notification-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// SpeechRecognition might not be on the window object by default in TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  audioUrl?: string;
}

const supportedLanguages = [
    { value: 'en-NG', name: 'English', apiCode: 'en-NG' },
    { value: 'pcm', name: 'Nigerian Pidgin', apiCode: 'pcm' },
    { value: 'yo-NG', name: 'Yoruba', apiCode: 'yo-NG' },
    { value: 'ig-NG', name: 'Igbo', apiCode: 'ig-NG' },
    { value: 'ha-NG', name: 'Hausa', apiCode: 'ha-NG' },
];


export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, updateBalance, logout } = useAuth();
  const userName = user?.fullName || 'User';
  
  const [pendingAction, setPendingAction] = useState<AiAssistantFlowOutput['action']>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const [selectedLang, setSelectedLang] = useState('en-NG');


  // Initial greeting
  useEffect(() => {
    if (!isInitialized) {
        const initializeChat = async () => {
            setIsLoading(true);
            const greetingText = `Hello ${userName}, I am OVO, your personal banking assistant. How can I help you today?`;
            try {
                const ttsResponse = await fetch('/api/ai/text-to-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: greetingText, language: 'English' })
                });
                if (ttsResponse.ok) {
                    const ttsResult = await ttsResponse.json();
                    setMessages([{ sender: 'bot', text: greetingText, audioUrl: ttsResult?.media }]);
                } else {
                    setMessages([{ sender: 'bot', text: greetingText }]);
                }
            } catch (error) {
                // Silently fallback to text-only (TTS is optional)
                setMessages([{ sender: 'bot', text: greetingText }]);
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };
        initializeChat();
    }
  }, [isInitialized, toast, userName]);


  // Update recognition language when user selects a new one
  useEffect(() => {
      if (recognitionRef.current) {
          const langObj = supportedLanguages.find(l => l.value === selectedLang);
          recognitionRef.current.lang = langObj ? langObj.apiCode : 'en-NG';
      }
  }, [selectedLang]);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
         toast({ variant: 'destructive', title: 'Browser Not Supported', description: 'Voice recognition is not supported in your browser.'});
         return;
      }
      setInput('');
      recognitionRef.current?.start();
    }
  };

  const handleSendMessage = useCallback(async (e: React.FormEvent | null, text: string = input) => {
    e?.preventDefault();
    if (!text.trim() || isLoading || !user?.userId) return;

    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
      content: msg.text,
    }));

    try {
      const aiResponse = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForAI,
          query: text,
          userName: userName,
          userId: user.userId,
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        console.error('AI API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
      }

      const result = await aiResponse.json();

      if (result.action) {
          setPendingAction(result.action);
      }
      
      let audioUrl: string | undefined;
      try {
        const ttsResponse = await fetch('/api/ai/text-to-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: result.response, language: result.detectedLanguage })
        });
        if (ttsResponse.ok) {
            const ttsResult = await ttsResponse.json();
            audioUrl = ttsResult?.media;
        }
        // Silently fallback to text-only if TTS fails (it's optional)
      } catch (ttsError) {
        // Silently fallback to text-only (TTS is optional)
      }

      const botMessage: Message = { sender: 'bot', text: result.response, audioUrl: audioUrl };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error in AI Assistant:", error);
      const errorMessage: Message = { sender: 'bot', text: "I'm sorry, I encountered a technical issue. Could you please try again?" };
      setMessages(prev => [...prev, errorMessage]);
      toast({
          variant: 'destructive',
          title: 'AI Assistant Error',
          description: "Could not get a response from the assistant.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, toast, user?.userId, userName]);

  // Request microphone permission and setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({ variant: 'destructive', title: 'Voice Error', description: `An error occurred: ${event.error}`});
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(null, transcript);
      };
      recognitionRef.current = recognition;
    } else {
        toast({ variant: 'destructive', title: 'Browser Not Supported', description: 'Voice recognition is not supported in your browser.'});
    }
  }, [handleSendMessage, toast]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'bot' && lastMessage.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = lastMessage.audioUrl;
        audioRef.current.play().catch(e => console.error("Audio playback failed", e));
      }
    }
  }, [messages]);
  
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    setPendingAction(null); // Close the confirmation dialog
    setIsPinModalOpen(true); // Open the PIN modal
  };

  const handleFinalSubmit = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'internal_transfer') {
      setIsProcessing(true);
      setApiError(null);
      try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');

        const clientReference = `ai-transfer-${crypto.randomUUID()}`;
        
        const response = await fetch('/api/transfers/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                recipientAccountNumber: pendingAction.details.recipientAccountNumber,
                amount: pendingAction.details.amount,
                narration: `AI-assisted transfer`,
                clientReference,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            const error: any = new Error(result.message || 'Transfer failed.');
            error.response = response;
            throw error;
        }
        
        updateBalance(result.data.newSenderBalance);
        addNotification({
            title: 'Transfer Successful!',
            description: `You sent ₦${pendingAction.details.amount.toLocaleString()} to ${pendingAction.details.recipientName}.`,
            category: 'transaction',
        });
        toast({ title: 'Transfer Successful!' });
        setIsPinModalOpen(false);

      } catch (error: any) {
        let description = 'An unknown error occurred.';
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            description = 'Please check your internet connection.';
        } else if (error.response?.status === 401) {
            description = 'Your session has expired. Please log in again.';
            logout();
        } else if (error.message) {
            description = error.message;
        }
        setApiError(description);
        setIsPinModalOpen(true); 
      } finally {
        setIsProcessing(false);
        setPendingAction(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 pr-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
               {message.sender === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
            <div className="flex items-start gap-3 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
              <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Speak or type your command..."
            className="flex-1"
            disabled={isLoading || isRecording}
          />
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="w-auto">
                <SelectValue asChild>
                    <Languages className="h-5 w-5" />
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {supportedLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                        {lang.name}
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button type="button" size="icon" onClick={handleMicClick} disabled={isLoading}>
            {isRecording ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
            <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
          </Button>
          <Button type="submit" disabled={isLoading || isRecording || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
      <audio ref={audioRef} className="hidden" />
       <ActionConfirmationDialog
        action={pendingAction}
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
       <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleFinalSubmit}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Authorize Transaction"
      />
    </div>
  );
}
