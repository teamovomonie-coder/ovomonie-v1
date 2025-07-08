
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { TicTacToeGame } from '@/components/gaming/tic-tac-toe-game';
import { Game2048 } from '@/components/gaming/2048-game';
import { LudoGame } from '@/components/gaming/ludo-game';
import { WhotGame } from '@/components/gaming/whot-game';
import { Badge } from '../ui/badge';

type GameId = 'tic-tac-toe' | '2048' | 'ludo' | 'whot' | null;

const games = [
    { id: 'ludo', title: 'Ludo Classic', component: LudoGame, category: 'Board & Card', image: 'https://placehold.co/600x400.png', hint: 'ludo board' },
    { id: 'whot', title: 'Whot!', component: WhotGame, category: 'Board & Card', image: 'https://placehold.co/600x400.png', hint: 'whot cards' },
    { id: '2048', title: '2048', component: Game2048, category: 'Puzzle & Strategy', image: 'https://placehold.co/600x400.png', hint: 'number puzzle', hasChallenge: true },
    { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', component: TicTacToeGame, category: 'Puzzle & Strategy', image: 'https://placehold.co/600x400.png', hint: 'tic tac toe' },
];

function GameSelectionScreen({ onSelectGame }: { onSelectGame: (id: GameId) => void }) {
    return (
        <Card className="shadow-none border-none sm:border sm:shadow-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">Gaming Hub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {['Board & Card', 'Puzzle & Strategy'].map(category => (
                    <div key={category}>
                        <h3 className="text-lg font-semibold mb-2">{category}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {games.filter(g => g.category === category).map(game => (
                                <Card key={game.id} className="cursor-pointer group hover:shadow-lg transition-shadow" onClick={() => onSelectGame(game.id as GameId)}>
                                    <CardContent className="p-0">
                                        <div className="relative h-24 w-full">
                                            <Image src={game.image} alt={game.title} layout="fill" objectFit="cover" className="rounded-t-lg group-hover:scale-105 transition-transform" data-ai-hint={game.hint} />
                                             {game.hasChallenge && (
                                                <Badge className="absolute top-2 left-2 bg-yellow-400 text-black hover:bg-yellow-500">
                                                    <Trophy className="w-3 h-3 mr-1" />
                                                    Challenge
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-semibold text-sm">{game.title}</h4>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function GamingHub() {
    const [activeGame, setActiveGame] = useState<GameId>(null);

    const selectedGame = games.find(g => g.id === activeGame);
    const GameComponent = selectedGame?.component;

    const renderContent = () => {
        if (activeGame && GameComponent) {
            return (
                 <motion.div
                    key={activeGame}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    <div className="p-4 sm:p-0">
                        <Button variant="ghost" onClick={() => setActiveGame(null)} className="mb-2">
                            <ArrowLeft className="mr-2" /> Back to Hub
                        </Button>
                        <GameComponent />
                    </div>
                </motion.div>
            );
        }

        return (
             <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <GameSelectionScreen onSelectGame={setActiveGame} />
             </motion.div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {renderContent()}
        </AnimatePresence>
    );
}
