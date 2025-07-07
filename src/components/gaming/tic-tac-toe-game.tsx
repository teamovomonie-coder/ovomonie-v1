"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Circle, RotateCcw } from 'lucide-react';

const Square = ({ value, onClick, isWinner }: { value: 'X' | 'O' | null, onClick: () => void, isWinner: boolean }) => (
  <button
    className={cn(
      "w-20 h-20 sm:w-24 sm:h-24 m-1 flex items-center justify-center text-4xl sm:text-5xl font-bold border-2 rounded-lg transition-all",
      isWinner ? "bg-primary text-primary-foreground scale-110" : "bg-muted hover:bg-muted/80 text-foreground"
    )}
    onClick={onClick}
  >
    {value === 'X' && <X className="w-12 h-12" />}
    {value === 'O' && <Circle className="w-12 h-12" />}
  </button>
);

const calculateWinner = (squares: ('X' | 'O' | null)[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return null;
};

export function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  
  const winnerInfo = calculateWinner(board);
  const winner = winnerInfo?.winner;
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (i: number) => {
    if (winner || board[i]) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };
  
  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isDraw) {
    status = "It's a draw!";
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tic-Tac-Toe</CardTitle>
        <CardDescription>A classic game of X's and O's.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <p className="text-lg font-semibold mb-4 h-6">{status}</p>
        <div className="grid grid-cols-3">
          {[0, 1, 2].map(row => 
            [0, 1, 2].map(col => {
              const i = row * 3 + col;
              return <Square key={i} value={board[i]} onClick={() => handleClick(i)} isWinner={!!winnerInfo?.line.includes(i)} />;
            })
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={resetGame} className="w-full">
            <RotateCcw className="mr-2"/>
            New Game
        </Button>
      </CardFooter>
    </Card>
  );
}
