"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Maze, type Cell } from "@/lib/maze"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"

export default function MazeGenerator() {
  const [width, setWidth] = useState(15)
  const [height, setHeight] = useState(15)
  const [edgeDensity, setEdgeDensity] = useState(1) // 1 = perfect maze, <1 = more paths
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maze, setMaze] = useState<Maze | null>(null)
  const [cellSize, setCellSize] = useState(30)
  const [solutionPath, setSolutionPath] = useState<Cell[]>([])

  // Game state
  const [gameActive, setGameActive] = useState(false)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 })
  const [visibleCells, setVisibleCells] = useState<Set<string>>(new Set())
  const [visibleWalls, setVisibleWalls] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  // Generate a new maze
  const generateMaze = () => {
    // Ensure valid dimensions
    const validWidth = Math.max(5, width)
    const validHeight = Math.max(5, height)

    try {
      const newMaze = new Maze(validWidth, validHeight, edgeDensity)
      newMaze.generate()
      setMaze(newMaze)
      setSolutionPath([]) // Clear the solution path when generating a new maze

      // Reset game state
      setGameActive(false)
      setPlayerPosition({ x: 0, y: 0 })
      setVisibleCells(new Set())
      setVisibleWalls(new Set())
      setScore(0)
      setGameWon(false)
    } catch (error) {
      console.error("Error generating maze:", error)
    }
  }

  const findSolution = () => {
    if (!maze) return

    const path = maze.findPath()
    setSolutionPath(path)
  }

  const startGame = () => {
    if (!maze) return

    setGameActive(true)
    setPlayerPosition({ x: 0, y: 0 })

    // Make starting cell visible
    const newVisibleCells = new Set<string>()
    newVisibleCells.add("0,0")
    setVisibleCells(newVisibleCells)

    setVisibleWalls(new Set())
    setScore(0)
    setGameWon(false)
  }

  const movePlayer = (dx: number, dy: number) => {
    if (!maze || !gameActive || gameWon) return

    const newX = playerPosition.x + dx
    const newY = playerPosition.y + dy

    // Check if the move is valid (no wall in that direction)
    const currentCell = maze.grid[playerPosition.y][playerPosition.x]

    // Determine which direction we're moving
    let direction = ""
    if (dx === 1) direction = "east"
    else if (dx === -1) direction = "west"
    else if (dy === 1) direction = "south"
    else if (dy === -1) direction = "north"

    // Check if there's a wall in that direction
    if (!currentCell.links[direction as keyof typeof currentCell.links]) {
      // Hit a wall
      setScore((prevScore) => prevScore - 1)

      // Make the wall visible
      const wallKey = `${playerPosition.x},${playerPosition.y},${direction}`
      setVisibleWalls((prev) => new Set([...prev, wallKey]))

      return
    }

    // Valid move - update player position
    setPlayerPosition({ x: newX, y: newY })

    // Check if this is a new cell
    const cellKey = `${newX},${newY}`
    if (!visibleCells.has(cellKey)) {
      // Discovered a new cell
      setScore((prevScore) => prevScore + 5)

      // Make the cell visible
      setVisibleCells((prev) => new Set([...prev, cellKey]))
    }

    // Check if player reached the goal
    if (newX === width - 1 && newY === height - 1) {
      setGameWon(true)
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || !maze) return

      switch (e.key) {
        case "ArrowUp":
          movePlayer(0, -1)
          break
        case "ArrowDown":
          movePlayer(0, 1)
          break
        case "ArrowLeft":
          movePlayer(-1, 0)
          break
        case "ArrowRight":
          movePlayer(1, 0)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameActive, maze, playerPosition, visibleCells, visibleWalls])

  // Draw the maze on canvas
  useEffect(() => {
    if (!maze || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = width * cellSize
    canvas.height = height * cellSize

    // Clear canvas
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (gameActive) {
      // Game mode - only draw visible parts

      // Draw visible cells
      ctx.fillStyle = "#333"
      visibleCells.forEach((cellKey) => {
        const [x, y] = cellKey.split(",").map(Number)
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      })

      // Draw visible walls
      ctx.strokeStyle = "#aaa"
      ctx.lineWidth = 2
      visibleWalls.forEach((wallKey) => {
        const [x, y, direction] = wallKey.split(",")
        const cellX = Number(x) * cellSize
        const cellY = Number(y) * cellSize

        ctx.beginPath()
        switch (direction) {
          case "north":
            ctx.moveTo(cellX, cellY)
            ctx.lineTo(cellX + cellSize, cellY)
            break
          case "east":
            ctx.moveTo(cellX + cellSize, cellY)
            ctx.lineTo(cellX + cellSize, cellY + cellSize)
            break
          case "south":
            ctx.moveTo(cellX, cellY + cellSize)
            ctx.lineTo(cellX + cellSize, cellY + cellSize)
            break
          case "west":
            ctx.moveTo(cellX, cellY)
            ctx.lineTo(cellX, cellY + cellSize)
            break
        }
        ctx.stroke()
      })

      // Draw player
      ctx.fillStyle = "green"
      ctx.beginPath()
      ctx.arc(
        playerPosition.x * cellSize + cellSize / 2,
        playerPosition.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      // Draw goal (if visible or game won)
      if (visibleCells.has(`${width - 1},${height - 1}`) || gameWon) {
        ctx.fillStyle = "red"
        ctx.beginPath()
        ctx.arc(
          (width - 1) * cellSize + cellSize / 2,
          (height - 1) * cellSize + cellSize / 2,
          cellSize / 3,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    } else {
      // Preview mode - draw the entire maze

      // Draw cells
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw maze
      ctx.strokeStyle = "black"
      ctx.lineWidth = 2

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = maze.grid[y][x]
          if (!cell) continue // Skip if cell is undefined

          const cellX = x * cellSize
          const cellY = y * cellSize

          // Draw walls
          ctx.beginPath()

          // Top wall
          if (!cell.links.north) {
            ctx.moveTo(cellX, cellY)
            ctx.lineTo(cellX + cellSize, cellY)
          }

          // Right wall
          if (!cell.links.east) {
            ctx.moveTo(cellX + cellSize, cellY)
            ctx.lineTo(cellX + cellSize, cellY + cellSize)
          }

          // Bottom wall
          if (!cell.links.south) {
            ctx.moveTo(cellX, cellY + cellSize)
            ctx.lineTo(cellX + cellSize, cellY + cellSize)
          }

          // Left wall
          if (!cell.links.west) {
            ctx.moveTo(cellX, cellY)
            ctx.lineTo(cellX, cellY + cellSize)
          }

          ctx.stroke()
        }
      }

      // Draw solution path if it exists
      if (solutionPath.length > 0) {
        ctx.strokeStyle = "gold"
        ctx.lineWidth = 4
        ctx.beginPath()

        // Start at the center of the first cell
        const firstCell = solutionPath[0]
        ctx.moveTo(firstCell.x * cellSize + cellSize / 2, firstCell.y * cellSize + cellSize / 2)

        // Draw line to the center of each cell in the path
        for (let i = 1; i < solutionPath.length; i++) {
          const cell = solutionPath[i]
          ctx.lineTo(cell.x * cellSize + cellSize / 2, cell.y * cellSize + cellSize / 2)
        }

        ctx.stroke()
      }

      // Mark start (green) and end (red)
      ctx.fillStyle = "green"
      ctx.beginPath()
      ctx.arc(cellSize / 2, cellSize / 2, cellSize / 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "red"
      ctx.beginPath()
      ctx.arc(
        (width - 1) * cellSize + cellSize / 2,
        (height - 1) * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }, [maze, width, height, cellSize, solutionPath, gameActive, playerPosition, visibleCells, visibleWalls, gameWon])

  // Generate maze on first render
  useEffect(() => {
    try {
      generateMaze()
    } catch (error) {
      console.error("Error in initial maze generation:", error)
    }
  }, [])

  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Maze Explorer Game</h1>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width: {width}</Label>
            <Input
              id="width"
              type="number"
              min="5"
              max="30"
              value={width}
              onChange={(e) => setWidth(Number.parseInt(e.target.value) || 5)}
              disabled={gameActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height: {height}</Label>
            <Input
              id="height"
              type="number"
              min="5"
              max="30"
              value={height}
              onChange={(e) => setHeight(Number.parseInt(e.target.value) || 5)}
              disabled={gameActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cellSize">Cell Size: {cellSize}px</Label>
            <Input
              id="cellSize"
              type="number"
              min="20"
              max="50"
              value={cellSize}
              onChange={(e) => setCellSize(Number.parseInt(e.target.value) || 20)}
              disabled={gameActive}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Edge Density: {edgeDensity.toFixed(2)}</Label>
            <Slider
              value={[edgeDensity * 100]}
              min={50}
              max={100}
              step={1}
              onValueChange={(value) => setEdgeDensity(value[0] / 100)}
              disabled={gameActive}
            />
            <p className="text-sm text-muted-foreground">1.00 = Perfect maze (one path), Lower = More paths</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full" onClick={generateMaze} disabled={gameActive}>
              Generate New Maze
            </Button>
            <Button className="w-full" onClick={findSolution} variant="outline" disabled={gameActive}>
              Show Solution
            </Button>
          </div>

          <Button className="w-full" onClick={startGame} disabled={gameActive} variant="default">
            Start Game
          </Button>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4">
        <canvas ref={canvasRef} className="bg-white"></canvas>
      </div>

      {gameActive && (
        <div className="w-full max-w-3xl">
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">Score: {score}</h3>
              {gameWon && <div className="text-green-600 font-bold">You reached the goal! 🎉</div>}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              +5 points for discovering a new cell, -1 point for hitting a wall
            </p>
            <p className="text-sm text-muted-foreground">Use arrow keys or the buttons below to move</p>
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mb-4">
            <div></div>
            <Button variant="outline" size="icon" onClick={() => movePlayer(0, -1)} disabled={gameWon}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <div></div>

            <Button variant="outline" size="icon" onClick={() => movePlayer(-1, 0)} disabled={gameWon}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div></div>
            <Button variant="outline" size="icon" onClick={() => movePlayer(1, 0)} disabled={gameWon}>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div></div>
            <Button variant="outline" size="icon" onClick={() => movePlayer(0, 1)} disabled={gameWon}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <div></div>
          </div>

          <Button className="w-full max-w-[200px] mx-auto block" onClick={generateMaze} variant="destructive">
            End Game
          </Button>
        </div>
      )}

      {!gameActive && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Green circle = Start • Red circle = End</p>
        </div>
      )}
    </div>
  )
}
