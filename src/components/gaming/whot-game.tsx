
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- CARD & DECK DEFINITIONS ---

type Suit = 'Circle' | 'Triangle' | 'Cross' | 'Square' | 'Star' | 'Whot';
type Card = { suit: Suit; number: number };

const SUITS: Suit[] = ['Circle', 'Triangle', 'Cross', 'Square', 'Star'];
const NUMBERS: { [key in Suit]?: number[] } = {
  Circle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  Triangle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  Cross: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  Square: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  Star: [1, 2, 3, 4, 5, 7, 8],
  Whot: [20, 20, 20, 20, 20],
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    NUMBERS[suit]?.forEach(number => {
      deck.push({ suit, number });
    });
  });
  NUMBERS['Whot']?.forEach(number => {
    deck.push({ suit, number });
  });
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// --- SVG ICONS ---
const SuitIcon = ({ suit, className }: { suit: Suit, className?: string }) => {
    const icons: Record<Suit, React.ReactNode> = {
        Circle: <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" />,
        Triangle: <polygon points="12,2 22,22 2,22" strokeWidth="2" fill="none" />,
        Cross: <><path d="M4 4L20 20" strokeWidth="2" /><path d="M20 4L4 20" strokeWidth="2" /></>,
        Square: <rect x="3" y="3" width="18" height="18" strokeWidth="2" fill="none" />,
        Star: <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" strokeWidth="2" fill="none" />,
        Whot: <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold">WHOT</text>,
    };
    return <svg viewBox="0 0 24 24" className={className} stroke="currentColor">{icons[suit]}</svg>
}

// --- GAME COMPONENTS ---
const WhotCard = ({ card, isPlayable, onClick }: { card: Card, isPlayable?: boolean, onClick?: () => void }) => {
    const baseStyle = "w-16 h-24 sm:w-20 sm:h-28 bg-white border-2 rounded-lg flex flex-col items-center justify-center p-1 relative shadow-md transition-all";
    const playableStyle = "cursor-pointer hover:border-primary hover:-translate-y-2 hover:shadow-xl";
    return (
        <div className={`${baseStyle} ${isPlayable && onClick ? playableStyle : ''}`} onClick={onClick}>
            <span className="absolute top-1 left-2 font-bold text-lg">{card.number === 20 ? '' : card.number}</span>
            <SuitIcon suit={card.suit} className="w-10 h-10" />
            <span className="absolute bottom-1 right-2 font-bold text-lg">{card.number === 20 ? '' : card.number}</span>
        </div>
    );
};

const GameMessage = ({ message, winner }: { message: string, winner: string | null }) => {
    return (
        <AnimatePresence>
            <motion.div
                key={message}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center font-semibold text-lg p-2 rounded-md ${winner ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
            >
                {message}
            </motion.div>
        </AnimatePresence>
    )
}

// --- MAIN GAME COMPONENT ---
export function WhotGame() {
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [opponentHand, setOpponentHand] = useState<Card[]>([]);
    const [drawPile, setDrawPile] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState<string | null>(null);

    const startGame = useCallback(() => {
        const deck = shuffleDeck(createDeck());
        setPlayerHand(deck.slice(0, 5));
        setOpponentHand(deck.slice(5, 10));
        let firstCard = deck[10];
        // Ensure first card is not a special card
        while ([2, 14, 20].includes(firstCard.number)) {
            deck.push(firstCard);
            deck.splice(10, 1);
            firstCard = deck[10];
        }
        setDiscardPile([firstCard]);
        setDrawPile(deck.slice(11));
        setIsPlayerTurn(true);
        setWinner(null);
        setMessage('Your turn to play.');
    }, []);

    useEffect(() => {
        startGame();
    }, [startGame]);

    const isCardPlayable = (card: Card, topCard: Card) => {
        if (!topCard) return true; // First card
        return card.suit === topCard.suit || card.number === topCard.number || card.suit === 'Whot';
    };

    const handlePlayerPlay = (card: Card, index: number) => {
        if (!isPlayerTurn || winner) return;
        const topCard = discardPile[discardPile.length - 1];
        if (!isCardPlayable(card, topCard)) return;

        const newHand = [...playerHand];
        newHand.splice(index, 1);
        setPlayerHand(newHand);
        setDiscardPile(prev => [...prev, card]);

        if (newHand.length === 0) {
            setWinner('Player');
            setMessage('Congratulations, you win!');
            return;
        }
        
        // Handle special cards
        if (card.number === 2) { // Pick Two
             setMessage('Opponent picks two! Your turn again.');
             setOpponentHand(prev => [...prev, ...drawPile.slice(0, 2)]);
             setDrawPile(prev => prev.slice(2));
             // Player plays again
        } else if (card.number === 14) { // General Market
            setMessage('General market! Your turn again.');
            setOpponentHand(prev => [...prev, drawPile[0]]);
            setDrawPile(prev => prev.slice(1));
            // Player plays again
        } else if (card.number === 1) { // Hold On
             setMessage('Hold on! Your turn again.');
             // Player plays again
        } else {
             setIsPlayerTurn(false);
             setMessage('Opponent is thinking...');
        }
    };
    
    const handlePlayerDraw = () => {
        if (!isPlayerTurn || winner || drawPile.length === 0) return;
        setPlayerHand(prev => [...prev, drawPile[0]]);
        setDrawPile(prev => prev.slice(1));
        setIsPlayerTurn(false);
        setMessage('Opponent is thinking...');
    };

    // AI Opponent Logic
    useEffect(() => {
        if (!isPlayerTurn && !winner) {
            const timer = setTimeout(() => {
                const topCard = discardPile[discardPile.length - 1];
                const playableCardIndex = opponentHand.findIndex(card => isCardPlayable(card, topCard));
                
                if (playableCardIndex !== -1) {
                    const cardToPlay = opponentHand[playableCardIndex];
                    const newOpponentHand = [...opponentHand];
                    newOpponentHand.splice(playableCardIndex, 1);
                    
                    setOpponentHand(newOpponentHand);
                    setDiscardPile(prev => [...prev, cardToPlay]);

                    if (newOpponentHand.length === 0) {
                        setWinner('Opponent');
                        setMessage('Opponent wins! Better luck next time.');
                        return;
                    }

                    if (cardToPlay.number === 2) {
                        setMessage('You pick two! Opponent plays again.');
                        setPlayerHand(prev => [...prev, ...drawPile.slice(0, 2)]);
                        setDrawPile(prev => prev.slice(2));
                        // Opponent plays again immediately
                        setIsPlayerTurn(false);
                    } else if (cardToPlay.number === 14) {
                        setMessage('General Market! Opponent plays again.');
                        setPlayerHand(prev => [...prev, drawPile[0]]);
                        setDrawPile(prev => prev.slice(1));
                        setIsPlayerTurn(false);
                    } else if (cardToPlay.number === 1) {
                        setMessage('Hold On! Opponent plays again.');
                        setIsPlayerTurn(false);
                    } else {
                        setIsPlayerTurn(true);
                        setMessage('Your turn to play.');
                    }
                } else {
                    // AI draws a card
                    if (drawPile.length > 0) {
                        setOpponentHand(prev => [...prev, drawPile[0]]);
                        setDrawPile(prev => prev.slice(1));
                    }
                    setIsPlayerTurn(true);
                    setMessage('Your turn to play.');
                }
            }, 1500); // Simulate thinking time
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, winner, discardPile, opponentHand, playerHand, drawPile, startGame]);

    const topCard = discardPile[discardPile.length - 1];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Whot!</CardTitle>
                <CardDescription>The original Nigerian card game. Match suits or numbers to win!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 bg-green-800 p-4 rounded-lg min-h-[60vh]">
                {/* Opponent's Hand */}
                <div className="flex justify-center -space-x-12">
                    {opponentHand.map((_, index) => (
                        <div key={index} className="w-16 h-24 sm:w-20 sm:h-28 bg-blue-500 border-2 border-white rounded-lg shadow-md"></div>
                    ))}
                </div>

                <GameMessage message={message} winner={winner} />

                {/* Piles */}
                <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gray-500 border-2 border-dashed border-white rounded-lg shadow-inner cursor-pointer" onClick={handlePlayerDraw}></div>
                        <span className="text-white text-sm mt-1">Draw Pile ({drawPile.length})</span>
                    </div>
                    {topCard && (
                         <div className="flex flex-col items-center">
                            <WhotCard card={topCard} />
                            <span className="text-white text-sm mt-1">Discard Pile</span>
                        </div>
                    )}
                </div>

                {/* Player's Hand */}
                <div className="flex justify-center items-end -space-x-4 h-32">
                    {playerHand.map((card, index) => (
                         <WhotCard 
                            key={`${card.suit}-${card.number}-${index}`} 
                            card={card}
                            isPlayable={isCardPlayable(card, topCard)}
                            onClick={() => handlePlayerPlay(card, index)}
                        />
                    ))}
                </div>
            </CardContent>
             <CardFooter className="mt-4">
                <Button onClick={startGame} className="w-full">
                    <RotateCcw className="mr-2"/>
                    New Game
                </Button>
            </CardFooter>
        </Card>
    );
}
