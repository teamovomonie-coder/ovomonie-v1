
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

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

export function Game2048() {
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [gameOver, setGameOver] = useState(false);

  const initializeGrid = useCallback(() => {
    let newGrid = Array.from({ length: 4 }, () => Array(4).fill(null));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
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
      }
      setGrid(newGrid);
    }
  }, [grid, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  if (grid.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>2048</CardTitle>
        <CardDescription>Use arrow keys to merge tiles and reach 2048!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {gameOver && <div className="text-xl font-bold text-destructive mb-4">Game Over!</div>}
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
       <CardFooter>
        <Button onClick={initializeGrid} className="w-full">
            <RotateCcw className="mr-2"/>
            New Game
        </Button>
      </CardFooter>
    </Card>
  );
}
