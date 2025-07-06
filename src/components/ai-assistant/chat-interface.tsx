"use client";

import { useState, useRef, useEffect } from 'react';
import { getAiAssistantResponse } from '@/ai/flows/ai-assistant-flow';
import { textToSpeech, type SupportedLanguage } from '@/ai/flows/tts-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mic, User, Bot, Loader2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const userName = user?.fullName || 'User';

  // Initial greeting
  useEffect(() => {
    if (!isInitialized) {
        const initializeChat = async () => {
            setIsLoading(true);
            const greetingText = `Hello ${userName}, I am OVO, your personal banking assistant. How can I help you today?`;
            try {
                const { media } = await textToSpeech(greetingText, 'English');
                setMessages([{ sender: 'bot', text: greetingText, audioUrl: media }]);
            } catch (error) {
                console.error("TTS initialization failed", error);
                setMessages([{ sender: 'bot', text: greetingText }]);
                toast({
                    variant: 'destructive',
                    title: 'Audio Error',
                    description: 'Could not generate initial audio greeting.'
                });
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };
        initializeChat();
    }
  }, [isInitialized, toast, userName]);


  // Request microphone permission and setup SpeechRecognition
  useEffect(() => {
    const getMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please enable microphone permissions in your browser settings to use voice commands.',
        });
      }
    };
    getMicPermission();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

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
  }, [toast]);

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

  const handleSendMessage = async (e: React.FormEvent | null, text: string = input) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
      content: msg.text,
    }));

    try {
      const result = await getAiAssistantResponse({
        history: historyForAI,
        query: text,
        userName: userName,
      });
      const { media } = await textToSpeech(result.response, result.detectedLanguage);
      const botMessage: Message = { sender: 'bot', text: result.response, audioUrl: media };
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
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'bot' && lastMessage.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = lastMessage.audioUrl;
        audioRef.current.play().catch(e => console.error("Audio playback failed", e));
      }
    }
  }, [messages]);

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
    </div>
  );
}
