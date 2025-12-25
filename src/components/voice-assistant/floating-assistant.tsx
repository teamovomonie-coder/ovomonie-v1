"use client";

import { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SecurityGate } from "./security-gate";

interface Position {
  x: number;
  y: number;
}

export function FloatingAssistant() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [showSecurityGate, setShowSecurityGate] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const enabled = localStorage.getItem("voice-assistant-enabled");
    const dismissed = localStorage.getItem("voice-assistant-prompt-dismissed");
    const savedPos = localStorage.getItem("voice-assistant-position");

    if (savedPos) {
      setPosition(JSON.parse(savedPos));
    }

    if (enabled === "true") {
      setIsEnabled(true);
    } else if (!dismissed) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  const enableAssistant = () => {
    localStorage.setItem("voice-assistant-enabled", "true");
    setIsEnabled(true);
    setShowPrompt(false);
    toast({
      title: "Voice Assistant Enabled",
      description: "Tap the mic button anytime to start a conversation"
    });
  };

  const dismissPrompt = () => {
    localStorage.setItem("voice-assistant-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = clientX - dragRef.current.startX;
      const deltaY = clientY - dragRef.current.startY;

      setPosition({
        x: dragRef.current.startPosX + deltaX,
        y: dragRef.current.startPosY + deltaY
      });
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        const windowWidth = window.innerWidth;
        const snapX = position.x > windowWidth / 2 ? windowWidth - 80 : 20;
        const newPos = { x: snapX, y: Math.max(60, Math.min(position.y, window.innerHeight - 140)) };
        setPosition(newPos);
        localStorage.setItem("voice-assistant-position", JSON.stringify(newPos));
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchend", handleEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, position]);

  const isSensitiveQuery = (text: string): boolean => {
    const sensitive = [
      "balance", "account", "transaction", "transfer", "send money", "pay", "withdraw",
      "card", "pin", "password", "statement", "history", "loan", "credit"
    ];
    return sensitive.some(keyword => text.toLowerCase().includes(keyword));
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);

      if (isSensitiveQuery(transcript)) {
        setPendingQuery(transcript);
        setShowSecurityGate(true);
      } else {
        await processQuery(transcript);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not recognize speech. Please try again."
      });
    };

    recognitionRef.current.start();
  };

  const processQuery = async (query: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      
      // Add user query to history
      const newHistory = [...conversationHistory, { role: 'user', content: query }];
      
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: query,
          history: conversationHistory,
          userName: "User",
          userId: "demo-user"
        })
      });

      const data = await response.json();
      
      if (data.response) {
        // Add AI response to history
        setConversationHistory([...newHistory, { role: 'assistant', content: data.response }]);
        
        // Check if AI wants to perform an action
        if (data.action) {
          setPendingAction(data.action);
          setPendingQuery(query);
          setShowSecurityGate(true);
          speakResponse("I can help you with that. Please verify your identity to continue.");
        } else {
          speakResponse(data.response);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to get response"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your request"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string, language: string = 'en-NG') => {
    setIsSpeaking(true);

    // Always use fallback browser TTS for now (Google Cloud TTS requires separate API key)
    fallbackToWebSpeech(text);
  };

  const fallbackToWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-NG';

    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        if (isEnabled && !showSecurityGate) {
          startListening();
        }
      }, 500);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSecuritySuccess = async () => {
    setShowSecurityGate(false);
    
    if (pendingAction) {
      // Execute the actual action
      await executeAction(pendingAction);
      setPendingAction(null);
    } else {
      await processQuery(pendingQuery);
    }
    
    setPendingQuery("");
  };

  const executeAction = async (action: any) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      
      // Execute the action based on type
      if (action.type === 'internal_transfer') {
        const response = await fetch("/api/transactions/internal-transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(action.details)
        });
        
        const result = await response.json();
        if (response.ok) {
          speakResponse(`Transfer successful! I've sent ${action.details.amount} naira to ${action.details.recipientName || 'the recipient'}.`);
        } else {
          speakResponse(`Sorry, the transfer failed. ${result.message || 'Please try again.'}`);
        }
      }
      // Add more action types here (bill payment, airtime, etc.)
    } catch (error) {
      speakResponse("Sorry, I couldn't complete that action. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isEnabled && !showPrompt) return null;

  return (
    <>
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl">
                <Icons.Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Voice Assistant</h3>
                <p className="text-xs text-slate-500">AI-powered help anytime</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Enable the floating voice assistant to get instant help with your account, transactions, and more using just your voice.
            </p>
            <div className="flex gap-3">
              <button
                onClick={dismissPrompt}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Not Now
              </button>
              <button
                onClick={enableAssistant}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-medium hover:opacity-90"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {isEnabled && (
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (!isDragging) {
              e.stopPropagation();
              startListening();
            }
          }}
          style={{
            position: "fixed",
            right: position.x,
            bottom: position.y,
            zIndex: 9999,
            touchAction: "none"
          }}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isListening
              ? "bg-red-500 animate-pulse"
              : isSpeaking
              ? "bg-green-500 animate-pulse"
              : isProcessing
              ? "bg-blue-500"
              : "bg-gradient-to-br from-primary to-primary/80"
          }`}
        >
          {isProcessing ? (
            <Icons.Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Icons.Mic className={`h-5 w-5 text-white ${isListening ? "animate-pulse" : ""}`} />
          )}
        </button>
      )}

      <SecurityGate
        isOpen={showSecurityGate}
        onClose={() => {
          setShowSecurityGate(false);
          setPendingQuery("");
        }}
        onSuccess={handleSecuritySuccess}
      />
    </>
  );
}
