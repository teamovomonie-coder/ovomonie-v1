
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Crown, X, Settings, User as UserIcon, Bot } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


// --- TYPES & CONSTANTS ---
type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
type TokenState = { id: number; position: number; state: 'home' | 'active' | 'finished' };

const PLAYER_COLORS: { [key in PlayerColor]: { base: string, path: string } } = {
  red:    { base: 'bg-red-500',    path: 'bg-red-300' },
  green:  { base: 'bg-green-500',  path: 'bg-green-300' },
  yellow: { base: 'bg-yellow-400', path: 'bg-yellow-200' },
  blue:   { base: 'bg-blue-500',   path: 'bg-blue-300' },
};

const PATH: { [key in PlayerColor]: number[] } = {
  red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 101, 102, 103, 104, 105, 106],
  green: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 201, 202, 203, 204, 205, 206],
  yellow: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 301, 302, 303, 304, 305, 306],
  blue: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 401, 402, 403, 404, 405, 406],
};

const SAFE_SPOTS = [1, 9, 14, 22, 27, 35, 40, 48];

// --- GAME LOGIC ---
const LudoGameLogic = () => {
    const [players, setPlayers] = useState<Record<PlayerColor, TokenState[]>>({ red: [], green: [], yellow: [], blue: [] });
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<PlayerColor | null>(null);
    const [message, setMessage] = useState('Red player, roll the dice!');

    const playerOrder: PlayerColor[] = useMemo(() => ['red', 'green', 'yellow', 'blue'], []);
    const currentPlayer = playerOrder[currentPlayerIndex];

    const initializeGame = useCallback(() => {
        const initialPlayers: Record<PlayerColor, TokenState[]> = { red: [], green: [], yellow: [], blue: [] };
        playerOrder.forEach(color => {
            initialPlayers[color] = Array.from({ length: 4 }, (_, i) => ({ id: i, position: -1, state: 'home' }));
        });
        setPlayers(initialPlayers);
        setCurrentPlayerIndex(0);
        setDiceValue(null);
        setWinner(null);
        setMessage('Red player, roll the dice!');
    }, [playerOrder]);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    const nextTurn = useCallback(() => {
        if (diceValue !== 6) {
            setCurrentPlayerIndex(prev => (prev + 1) % 4);
        }
        setDiceValue(null);
        setMessage(`${playerOrder[(currentPlayerIndex + (diceValue === 6 ? 0 : 1)) % 4]} player, roll the dice!`);
    }, [diceValue, currentPlayerIndex, playerOrder]);
    
    const rollDice = () => {
        if (isRolling || diceValue !== null) return;
        setIsRolling(true);
        const roll = Math.floor(Math.random() * 6) + 1;
        setTimeout(() => {
            setDiceValue(roll);
            setIsRolling(false);
            
            const movableTokens = players[currentPlayer].filter(token => {
                if (token.state === 'home' && roll === 6) return true;
                if (token.state === 'active') {
                   const path = PATH[currentPlayer];
                   const currentPathIndex = path.indexOf(token.position);
                   return currentPathIndex + roll < path.length;
                }
                return false;
            });

            if (movableTokens.length === 0) {
                 setTimeout(() => nextTurn(), 1000);
            } else {
                 setMessage(`${currentPlayer} player, move your token.`);
            }
        }, 1000);
    };

    const moveToken = (tokenId: number) => {
        if (diceValue === null) return;

        const newPlayers = JSON.parse(JSON.stringify(players));
        const token = newPlayers[currentPlayer].find((t:TokenState) => t.id === tokenId);
        
        if (!token) return;

        // Move out of home
        if (token.state === 'home' && diceValue === 6) {
            token.position = PATH[currentPlayer][0];
            token.state = 'active';
        } 
        // Move along the path
        else if (token.state === 'active') {
            const path = PATH[currentPlayer];
            const currentPathIndex = path.indexOf(token.position);
            const newPathIndex = currentPathIndex + diceValue;

            if (newPathIndex < path.length) {
                const newPosition = path[newPathIndex];
                token.position = newPosition;

                // Check for captures
                if (!SAFE_SPOTS.includes(newPosition)) {
                     for (const color of playerOrder) {
                        if (color !== currentPlayer) {
                            newPlayers[color].forEach((opponentToken: TokenState) => {
                                if (opponentToken.position === newPosition) {
                                    opponentToken.position = -1;
                                    opponentToken.state = 'home';
                                }
                            });
                        }
                    }
                }
                
                // Check if finished
                if (newPathIndex >= 52) { // 52 main path tiles
                    token.state = 'finished';
                }
            }
        } else {
            return; // Not a valid move
        }
        
        setPlayers(newPlayers);
        checkWinner(newPlayers);
        setTimeout(() => nextTurn(), 200);
    };

    const checkWinner = (currentPlayers: Record<PlayerColor, TokenState[]>) => {
        if (currentPlayers[currentPlayer].every(t => t.state === 'finished')) {
            setWinner(currentPlayer);
        }
    };
    
    return { players, currentPlayer, diceValue, isRolling, winner, message, rollDice, moveToken, initializeGame };
}

// --- UI COMPONENTS ---
const Dice = ({ value, isRolling }: { value: number | null, isRolling: boolean }) => (
    <div className="w-12 h-12 perspective-800">
        <div className={`relative w-full h-full preserve-3d transition-transform duration-1000 ${isRolling ? 'animate-roll' : ''}`} style={{ transform: `rotateX(${value === 1 ? '0' : value === 2 ? '-90' : value === 3 ? '0' : value === 4 ? '180' : value === 5 ? '90' : '0'}deg) rotateY(${value === 3 ? '90' : value === 4 ? '0' : value === 5 ? '0' : value === 6 ? '-90' : '0'}deg)` }}>
            {[1, 2, 3, 4, 5, 6].map(side => (
                <div key={side} className={`absolute w-full h-full bg-white border border-gray-300 rounded-md flex items-center justify-center text-3xl font-bold p-2 ${
                    side === 1 ? 'transform translate-z-6' :
                    side === 2 ? 'transform rotate-x-90 translate-z-6' :
                    side === 3 ? 'transform rotate-y-90 translate-z-6' :
                    side === 4 ? 'transform rotate-x-180 translate-z-6' :
                    side === 5 ? 'transform rotate-x-270 translate-z-6' :
                    'transform rotate-y-270 translate-z-6'
                }`}>
                    <div className="flex flex-wrap justify-center items-center w-full h-full">
                        {Array.from({length: side}).map((_, i) => <div key={i} className="w-2 h-2 bg-red-500 rounded-full m-0.5"></div>)}
                    </div>
                </div>
            ))}
        </div>
        <style jsx>{`
            .perspective-800 { perspective: 800px; }
            .preserve-3d { transform-style: preserve-3d; }
            .translate-z-6 { transform: translateZ(1.5rem); }
            @keyframes roll {
                0% { transform: rotateX(0deg) rotateY(0deg); }
                100% { transform: rotateX(1440deg) rotateY(1440deg); }
            }
            .animate-roll { animation: roll 1s ease-out; }
        `}</style>
    </div>
);

const LudoBoard = ({ players, onTokenClick, currentPlayer, diceValue }: { players: Record<PlayerColor, TokenState[]>, onTokenClick: (color: PlayerColor, id: number) => void, currentPlayer: PlayerColor, diceValue: number | null }) => {
    // This is a complex visual component. A simplified grid-based layout for demonstration.
    // The visual logic here is illustrative and can be expanded with more detailed CSS/SVG for a richer look.
    return (
        <div className="relative w-[325px] h-[325px] sm:w-[455px] sm:h-[455px] bg-gray-100 p-[10px] grid grid-cols-15 grid-rows-15">
            {/* Base areas */}
            {[...Array(6)].map((_, r) => [...Array(6)].map((_, c) => <div key={`r${r}c${c}`} className="col-start-[1] row-start-[1] bg-red-500" style={{gridColumn: c+1, gridRow: r+1}}></div>))}
            {[...Array(6)].map((_, r) => [...Array(6)].map((_, c) => <div key={`g${r}c${c}`} className="col-start-[10] row-start-[1] bg-green-500" style={{gridColumn: c+10, gridRow: r+1}}></div>))}
            {[...Array(6)].map((_, r) => [...Array(6)].map((_, c) => <div key={`y${r}c${c}`} className="col-start-[1] row-start-[10] bg-yellow-400" style={{gridColumn: c+1, gridRow: r+10}}></div>))}
            {[...Array(6)].map((_, r) => [...Array(6)].map((_, c) => <div key={`b${r}c${c}`} className="col-start-[10] row-start-[10] bg-blue-500" style={{gridColumn: c+10, gridRow: r+10}}></div>))}
            
            {/* White paths */}
            {[...Array(3)].map((_, r) => [...Array(15)].map((_, c) => <div key={`hpath${r}c${c}`} className="col-start-[1] row-start-[7] bg-white" style={{gridColumn: c+1, gridRow: r+7}}></div>))}
            {[...Array(15)].map((_, r) => [...Array(3)].map((_, c) => <div key={`vpath${r}c${c}`} className="col-start-[7] row-start-[1] bg-white" style={{gridColumn: c+7, gridRow: r+1}}></div>))}
            
            {/* Center Home */}
            <div className="col-start-[7] row-start-[7] col-span-3 row-span-3 bg-white flex items-center justify-center">
                <div className="w-full h-full relative transform rotate-45">
                    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-green-500"></div>
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-yellow-400"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500"></div>
                </div>
            </div>
            
            <style jsx>{`
                .grid-cols-15 { grid-template-columns: repeat(15, minmax(0, 1fr)); }
                .grid-rows-15 { grid-template-rows: repeat(15, minmax(0, 1fr)); }
            `}</style>
             <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-4xl font-black text-white mix-blend-overlay">LUDO</p>
        </div>
    );
};

const PlayerInfo = ({ name, avatar, isCurrent }: { name: string, avatar: React.ReactNode, isCurrent: boolean }) => (
    <div className={cn("flex flex-col items-center gap-2 transition-all", isCurrent ? 'scale-110' : 'opacity-60')}>
        {avatar}
        <p className={cn("font-bold text-white", isCurrent && "text-yellow-300")}>{name}</p>
    </div>
);

export function LudoGame() {
    const { players, currentPlayer, diceValue, isRolling, winner, message, rollDice, moveToken, initializeGame } = LudoGameLogic();

    return (
        <Card className="bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-700 text-white">
            <CardHeader className="flex flex-row justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="secondary" size="icon"><X/></Button>
                    <Button variant="secondary" size="icon"><Settings/></Button>
                </div>
                <CardTitle>Ludo Classic</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 sm:gap-8">
                <LudoBoard players={players} onTokenClick={(color, id) => moveToken(id)} currentPlayer={currentPlayer} diceValue={diceValue}/>
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-yellow-300">{message}</h3>
                </div>
                <div className="flex w-full justify-between items-center px-4">
                     <PlayerInfo name="You" avatar={<Avatar><AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person avatar"/><AvatarFallback>U</AvatarFallback></Avatar>} isCurrent={currentPlayer === 'red'} />
                     <div className="flex flex-col items-center gap-2">
                        <Dice value={diceValue} isRolling={isRolling} />
                        <Button onClick={rollDice} disabled={isRolling || diceValue !== null || !!winner} variant="secondary">Roll Dice</Button>
                     </div>
                     <PlayerInfo name="Computer" avatar={<Avatar><AvatarFallback><Bot/></AvatarFallback></Avatar>} isCurrent={currentPlayer !== 'red'} />
                </div>
            </CardContent>
            <AnimatePresence>
                {winner && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10">
                        <Crown className="w-24 h-24 text-yellow-400"/>
                        <h2 className="text-4xl font-bold mt-4 capitalize">{winner} Wins!</h2>
                        <p>Congratulations!</p>
                        <Button onClick={initializeGame} className="mt-8">Play Again</Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
