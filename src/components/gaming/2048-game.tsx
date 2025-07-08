
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/notification-context';
import { PinModal } from '@/components/auth/pin-modal';

const TILE_COLORS: { [key: number]: string } = {
  2: 'bg-gray-200 text-gray-800', 4: 'bg-orange-200 text-gray-800',
  8: 'bg-orange-400 text-white', 16: 'bg-orange-500 text-white',
  32: 'bg-red-400 text-white', 64: 'bg-red-500 text-white',
  128: 'bg-yellow-400 text-white', 256: 'bg-yellow-500 text-white',
  512: 'bg-yellow-600 text-white', 1024: 'bg-green-400 text-white',
  2048: 'bg-green-500 text-white',
};

const getTileColor = (value: number) => TILE_COLORS[value] || 'bg-gray-800 text-white';

const addRandomTile = (grid: (number | null)[][]) => {
  let emptyTiles = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i][j] === null) {
        emptyTiles.push({ x: i, y: j });
      }
    }
  }
  if (emptyTiles.length > 0) {
    const { x, y } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    grid[x][y] = Math.random() < 0.9 ? 2 : 4;
  }
  return grid;
};

const slide = (row: (number | null)[]) => {
  const arr = row.filter(val => val);
  const missing = 4 - arr.length;
  const zeros = Array(missing).fill(null);
  return arr.concat(zeros);
};

const combine = (row: (number | null)[]) => {
  for (let i = 0; i < 3; i++) {
    if (row[i] !== null && row[i] === row[i + 1]) {
      row[i] = row[i]! * 2;
      row[i + 1] = null;
    }
  }
  return row;
};

const operate = (row: (number | null)[]) => {
  let newRow = slide(row);
  newRow = combine(newRow);
  newRow = slide(newRow);
  return newRow;
};

const rotateGrid = (grid: (number | null)[][]) => {
    const newGrid = Array.from({ length: 4 }, () => Array(4).fill(null));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        newGrid[i][j] = grid[j][i];
      }
    }
    return newGrid;
};

const flipGrid = (grid: (number | null)[][]) => {
    return grid.map(row => row.slice().reverse());
};

const isGameOver = (grid: (number | null)[][]) => {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === null) return false;
            if (i < 3 && grid[i][j] === grid[i + 1][j]) return false;
            if (j < 3 && grid[i][j] === grid[i][j + 1]) return false;
        }
    }
    return true;
}

const CHALLENGE = {
    gameId: '2048-challenge-1',
    target: 512, // The tile to reach
    entryFee: 100, // in Naira
    prize: 500, // in Naira
};

export function Game2048() {
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeWon, setChallengeWon] = useState(false);

  const { toast } = useToast();
  const { updateBalance } = useAuth();
  const { addNotification } = useNotifications();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const initializeGrid = useCallback((startChallenge = false) => {
    let newGrid = Array.from({ length: 4 }, () => Array(4).fill(null));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setGameOver(false);
    setChallengeActive(startChallenge);
    setChallengeWon(false);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleStartChallenge = async () => {
    setIsProcessing(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication token not found.');

      const response = await fetch('/api/gaming/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            gameId: CHALLENGE.gameId,
            entryFee: CHALLENGE.entryFee,
            clientReference: `challenge-entry-${crypto.randomUUID()}`
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to start challenge.');

      updateBalance(result.newBalanceInKobo);
      addNotification({
          category: 'transaction',
          title: 'Challenge Started!',
          description: `An entry fee of ₦${CHALLENGE.entryFee} has been deducted.`
      });
      toast({ title: 'Challenge Accepted!', description: 'Good luck!'});
      initializeGrid(true);
      setIsPinModalOpen(false);

    } catch(err) {
        setApiError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsProcessing(false);
    }
  }
  
  const handleClaimPrize = useCallback(async () => {
    try {
        const token = localStorage.getItem('ovo-auth-token');
        if (!token) throw new Error('Authentication token not found.');
        
        const response = await fetch('/api/gaming/challenge', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                gameId: CHALLENGE.gameId,
                prize: CHALLENGE.prize,
                clientReference: `challenge-win-${crypto.randomUUID()}`
            }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to claim prize.');
        
        updateBalance(result.newBalanceInKobo);
        addNotification({
            category: 'transaction',
            title: 'Prize Claimed!',
            description: `You won ₦${CHALLENGE.prize} from the 2048 challenge!`
        });
        toast({ title: `You Won ₦${CHALLENGE.prize}!`, description: 'Your wallet has been credited.' });

    } catch (err) {
        toast({ variant: 'destructive', title: 'Prize Claim Failed', description: err instanceof Error ? err.message : 'Please contact support.' });
    }
  }, [updateBalance, addNotification, toast]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver || challengeWon) return;
    
    let newGrid = JSON.parse(JSON.stringify(grid));
    let moved = false;

    if (e.key === 'ArrowUp') {
      newGrid = rotateGrid(newGrid);
      for (let i = 0; i < 4; i++) newGrid[i] = operate(newGrid[i]);
      newGrid = rotateGrid(newGrid);
    } else if (e.key === 'ArrowDown') {
      newGrid = rotateGrid(newGrid);
      newGrid = flipGrid(newGrid);
      for (let i = 0; i < 4; i++) newGrid[i] = operate(newGrid[i]);
      newGrid = flipGrid(newGrid);
      newGrid = rotateGrid(newGrid);
    } else if (e.key === 'ArrowLeft') {
      for (let i = 0; i < 4; i++) newGrid[i] = operate(newGrid[i]);
    } else if (e.key === 'ArrowRight') {
      newGrid = flipGrid(newGrid);
      for (let i = 0; i < 4; i++) newGrid[i] = operate(newGrid[i]);
      newGrid = flipGrid(newGrid);
    } else {
        return;
    }
    
    moved = JSON.stringify(grid) !== JSON.stringify(newGrid);

    if (moved) {
      newGrid = addRandomTile(newGrid);
      if (isGameOver(newGrid)) {
        setGameOver(true);
        if (challengeActive) {
            toast({ variant: 'destructive', title: 'Challenge Failed', description: 'Better luck next time!' });
        }
      }
      setGrid(newGrid);

      // Check for win condition
      const isWinner = newGrid.flat().includes(CHALLENGE.target);
      if (challengeActive && isWinner && !challengeWon) {
          setChallengeWon(true);
          handleClaimPrize();
      }
    }
  }, [grid, gameOver, challengeActive, challengeWon, handleClaimPrize, toast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  if (grid.length === 0) return null;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>2048</CardTitle>
        <CardDescription>Use arrow keys to merge tiles and reach 2048!</CardDescription>
        {challengeActive && (
             <div className="p-2 text-center rounded-md bg-primary/10 text-primary font-semibold">
                Challenge Mode: Reach the {CHALLENGE.target} tile to win ₦{CHALLENGE.prize}!
            </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {(gameOver || challengeWon) && (
            <div className={`text-xl font-bold mb-4 ${challengeWon ? 'text-green-500' : 'text-destructive'}`}>
                {challengeWon ? `You reached ${CHALLENGE.target}!` : 'Game Over!'}
            </div>
        )}
        <div className="bg-gray-400 p-2 sm:p-4 rounded-lg">
          {grid.map((row, i) => (
            <div key={i} className="flex gap-2 sm:gap-4 mb-2 sm:mb-4 last:mb-0">
              {row.map((val, j) => (
                <div key={j} className={cn("w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-md", getTileColor(val || 0))}>
                  {val}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
       <CardFooter className="flex-col sm:flex-row gap-2">
        <Button onClick={() => initializeGrid()} className="w-full sm:w-auto">
            <RotateCcw className="mr-2"/>
            New Game
        </Button>
        <Dialog>
            <DialogTrigger asChild>
                 <Button variant="secondary" className="w-full sm:w-auto flex-1">
                    <Trophy className="mr-2"/>
                    Daily Challenge
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>2048 Daily Challenge</DialogTitle>
                    <DialogDescription>
                        Think you have what it takes? Enter the challenge to win a prize.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center space-y-4">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
                    <p>Reach the <span className="font-bold text-primary">{CHALLENGE.target} tile</span></p>
                    <p>Entry Fee: <span className="font-bold">₦{CHALLENGE.entryFee.toLocaleString()}</span></p>
                    <p>Prize: <span className="font-bold">₦{CHALLENGE.prize.toLocaleString()}</span></p>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsPinModalOpen(true)}>Accept Challenge</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
    <PinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        onConfirm={handleStartChallenge}
        isProcessing={isProcessing}
        error={apiError}
        onClearError={() => setApiError(null)}
        title="Confirm Challenge Entry"
        description={`An entry fee of ₦${CHALLENGE.entryFee} will be deducted from your wallet.`}
    />
    </>
  );
}
