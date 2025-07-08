
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- TYPES & CONSTANTS ---
type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
type TokenState = { id: number; position: number; state: 'home' | 'active' | 'safe' | 'finished' };

const PLAYER_COLORS: { [key in PlayerColor]: string } = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
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

    const playerOrder: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
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
    }, []);

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
    <div className="w-16 h-16 sm:w-20 sm:h-20 perspective-800">
        <div className={`relative w-full h-full preserve-3d transition-transform duration-1000 ${isRolling ? 'animate-roll' : ''}`} style={{ transform: `rotateX(${value === 1 ? '0' : value === 2 ? '-90' : value === 3 ? '0' : value === 4 ? '180' : value === 5 ? '90' : '0'}deg) rotateY(${value === 3 ? '90' : value === 4 ? '0' : value === 5 ? '0' : value === 6 ? '-90' : '0'}deg)` }}>
            {[1, 2, 3, 4, 5, 6].map(side => (
                <div key={side} className={`absolute w-full h-full bg-white border border-gray-300 flex items-center justify-center text-3xl font-bold ${
                    side === 1 ? 'transform translate-z-8 sm:translate-z-10' :
                    side === 2 ? 'transform rotate-x-90 translate-z-8 sm:translate-z-10' :
                    side === 3 ? 'transform rotate-y-90 translate-z-8 sm:translate-z-10' :
                    side === 4 ? 'transform rotate-x-180 translate-z-8 sm:translate-z-10' :
                    side === 5 ? 'transform rotate-x-270 translate-z-8 sm:translate-z-10' :
                    'transform rotate-y-270 translate-z-8 sm:translate-z-10'
                }`}>{side}</div>
            ))}
        </div>
        <style jsx>{`
            .perspective-800 { perspective: 800px; }
            .preserve-3d { transform-style: preserve-3d; }
            .translate-z-8 { transform: translateZ(2rem); }
            @media (min-width: 640px) { .sm\\:translate-z-10 { transform: translateZ(2.5rem); } }
            @keyframes roll {
                0% { transform: rotateX(0deg) rotateY(0deg); }
                100% { transform: rotateX(1440deg) rotateY(1440deg); }
            }
            .animate-roll { animation: roll 1s ease-out; }
        `}</style>
    </div>
);

const LudoBoard = ({ players, onTokenClick, currentPlayer, diceValue }: { players: Record<PlayerColor, TokenState[]>, onTokenClick: (color: PlayerColor, id: number) => void, currentPlayer: PlayerColor, diceValue: number | null }) => {
    // A simplified grid-based layout for the Ludo board
    const getTilePosition = (index: number): { row: number, col: number } => {
        const boardSize = 13;
        if (index >= 1 && index <= 5) return { row: 6, col: index }; // Red start path
        if (index === 6) return { row: 5, col: 0 };
        if (index >= 7 && index <= 12) return { row: 5 - (index - 6), col: 0 };
        if (index === 13) return { row: 0, col: 1 };
        if (index >= 14 && index <= 18) return { row: 0, col: 1 + (index - 13) }; // Green start path
        if (index === 19) return { row: 0, col: 6 };
        if (index >= 20 && index <= 25) return { row: index - 19, col: 6 };
        if (index === 26) return { row: 6, col: 7 };
        if (index >= 27 && index <= 31) return { row: 6, col: 7 + (index - 26) }; // Yellow start path
        if (index === 32) return { row: 7, col: 12 };
        if (index >= 33 && index <= 38) return { row: 7 + (index - 32), col: 12 };
        if (index === 39) return { row: 12, col: 11 };
        if (index >= 40 && index <= 44) return { row: 12, col: 11 - (index - 39) }; // Blue start path
        if (index === 45) return { row: 12, col: 6 };
        if (index >= 46 && index <= 51) return { row: 12 - (index - 45), col: 6 };
        if (index === 52) return { row: 6, col: 5 };
        
        // Home paths
        if (index >= 101 && index <= 106) return { row: 6, col: 1 + (index - 101) };
        if (index >= 201 && index <= 206) return { row: 1 + (index - 201), col: 6 };
        if (index >= 301 && index <= 306) return { row: 6, col: 11 - (index - 301) };
        if (index >= 401 && index <= 406) return { row: 11 - (index - 401), col: 6 };
        
        return { row: -1, col: -1 }; // Should not happen
    };
    
    return (
        <div className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-white border-2 border-black grid grid-cols-13 grid-rows-13">
            {/* Base areas */}
            <div className="absolute top-0 left-0 w-6/13 h-6/13 bg-red-300"></div>
            <div className="absolute top-0 right-0 w-6/13 h-6/13 bg-green-300"></div>
            <div className="absolute bottom-0 left-0 w-6/13 h-6/13 bg-yellow-300"></div>
            <div className="absolute bottom-0 right-0 w-6/13 h-6/13 bg-blue-300"></div>

            {/* Path */}
            <div className="absolute top-6/13 left-0 w-full h-1/13 bg-gray-200"></div>
            <div className="absolute top-0 left-6/13 w-1/13 h-full bg-gray-200"></div>

            {/* Home Path Colors */}
            <div className="absolute top-6/13 left-1/13 w-5/13 h-1/13 bg-red-300"></div>
            <div className="absolute top-1/13 left-6/13 w-1/13 h-5/13 bg-green-300"></div>
            <div className="absolute top-6/13 right-1/13 w-5/13 h-1/13 bg-yellow-300"></div>
            <div className="absolute bottom-1/13 left-6/13 w-1/13 h-5/13 bg-blue-300"></div>
            
            {/* Center Home */}
            <div className="absolute top-6/13 left-6/13 w-1/13 h-1/13 bg-white">
                <div className="w-full h-full relative">
                    <div className="absolute top-0 left-0 w-0 h-0 border-l-[50%] border-r-[50%] border-b-[100%] border-l-transparent border-r-transparent border-b-red-300 transform -rotate-45 scale-150"></div>
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[50%] border-r-[50%] border-b-[100%] border-l-transparent border-r-transparent border-b-green-300 transform rotate-45 scale-150"></div>
                    <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[50%] border-r-[50%] border-t-[100%] border-l-transparent border-r-transparent border-t-yellow-300 transform -rotate-45 scale-150"></div>
                    <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[50%] border-r-[50%] border-t-[100%] border-l-transparent border-r-transparent border-t-blue-300 transform rotate-45 scale-150"></div>
                </div>
            </div>

            {/* Render Tokens */}
            {Object.entries(players).map(([color, tokens]) =>
                tokens.map(token => {
                    const isMovable = currentPlayer === color && diceValue && (token.state === 'home' ? diceValue === 6 : token.state === 'active');
                    const pos = getTilePosition(token.position);
                    return (
                        <div key={`${color}-${token.id}`}
                            onClick={() => onTokenClick(color as PlayerColor, token.id)}
                            className={`absolute w-1/13 h-1/13 rounded-full flex items-center justify-center cursor-pointer transition-all ${PLAYER_COLORS[color as PlayerColor]}`}
                            style={{
                                top: token.state === 'home' ? `calc(${['red', 'green'].includes(color) ? '12%' : '75%'} + ${token.id % 2 === 0 ? 0 : '18%'})` : `calc(${pos.row} / 13 * 100%)`,
                                left: token.state === 'home' ? `calc(${['red', 'yellow'].includes(color) ? '12%' : '75%'} + ${token.id < 2 ? 0 : '18%'})` : `calc(${pos.col} / 13 * 100%)`,
                            }}
                        >
                            <div className={`w-3/5 h-3/5 rounded-full bg-white/50 ${isMovable ? 'animate-pulse' : ''}`}></div>
                        </div>
                    );
                })
            )}
            
            <style jsx>{`
                .grid-cols-13 { grid-template-columns: repeat(13, minmax(0, 1fr)); }
                .grid-rows-13 { grid-template-rows: repeat(13, minmax(0, 1fr)); }
                .w-1\\/13 { width: ${100 / 13}%; } .h-1\\/13 { height: ${100 / 13}%; }
                .w-5\\/13 { width: ${500 / 13}%; } .h-5\\/13 { height: ${500 / 13}%; }
                .w-6\\/13 { width: ${600 / 13}%; } .h-6\\/13 { height: ${600 / 13}%; }
                .top-1\\/13 { top: ${100 / 13}%; } .bottom-1\\/13 { bottom: ${100 / 13}%; }
                .left-1\\/13 { left: ${100 / 13}%; } .right-1\\/13 { right: ${100 / 13}%; }
                .top-6\\/13 { top: ${600 / 13}%; } .left-6\\/13 { left: ${600 / 13}%; }
            `}</style>
        </div>
    );
};


export function LudoGame() {
    const { players, currentPlayer, diceValue, isRolling, winner, message, rollDice, moveToken, initializeGame } = LudoGameLogic();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ludo Classic</CardTitle>
                <CardDescription>The classic board game you love. Get all your tokens home to win!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8">
                <div className="order-2 md:order-1 flex flex-col items-center gap-4">
                    <p className="font-bold text-lg h-12 text-center">{message}</p>
                    <Dice value={diceValue} isRolling={isRolling} />
                    <Button onClick={rollDice} disabled={isRolling || diceValue !== null || !!winner}>
                        Roll Dice
                    </Button>
                </div>
                <div className="order-1 md:order-2">
                    <LudoBoard players={players} onTokenClick={(color, id) => moveToken(id)} currentPlayer={currentPlayer} diceValue={diceValue}/>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={initializeGame} className="w-full">
                    <RotateCcw className="mr-2"/>
                    New Game
                </Button>
            </CardFooter>
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
