"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Maze, type Cell } from "@/lib/maze"

export default function MazeGenerator() {
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [edgeDensity, setEdgeDensity] = useState(1) // 1 = perfect maze, <1 = more paths
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maze, setMaze] = useState<Maze | null>(null)
  const [cellSize, setCellSize] = useState(20)
  const [solutionPath, setSolutionPath] = useState<Cell[]>([])

  // Generate a new maze
  const generateMaze = () => {
    // Ensure valid dimensions
    const validWidth = Math.max(1, width)
    const validHeight = Math.max(1, height)

    try {
      const newMaze = new Maze(validWidth, validHeight, edgeDensity)
      newMaze.generate()
      setMaze(newMaze)
      setSolutionPath([]) // Clear the solution path when generating a new maze
    } catch (error) {
      console.error("Error generating maze:", error)
    }
  }

  const findSolution = () => {
    if (!maze) return

    const path = maze.findPath()
    setSolutionPath(path)
  }

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
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw maze
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2

    // Draw cells
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
    ctx.fillRect(0, 0, cellSize / 3, cellSize / 3)

    ctx.fillStyle = "red"
    ctx.fillRect(
      (width - 1) * cellSize + (cellSize * 2) / 3,
      (height - 1) * cellSize + (cellSize * 2) / 3,
      cellSize / 3,
      cellSize / 3,
    )
  }, [maze, width, height, cellSize, solutionPath])

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
      <h1 className="text-3xl font-bold mb-6">Random Maze Generator</h1>

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width: {width}</Label>
            <Input
              id="width"
              type="number"
              min="5"
              max="50"
              value={width}
              onChange={(e) => setWidth(Number.parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height: {height}</Label>
            <Input
              id="height"
              type="number"
              min="5"
              max="50"
              value={height}
              onChange={(e) => setHeight(Number.parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cellSize">Cell Size: {cellSize}px</Label>
            <Input
              id="cellSize"
              type="number"
              min="10"
              max="50"
              value={cellSize}
              onChange={(e) => setCellSize(Number.parseInt(e.target.value) || 10)}
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
            />
            <p className="text-sm text-muted-foreground">1.00 = Perfect maze (one path), Lower = More paths</p>
          </div>

          <Button className="w-full mt-6" onClick={generateMaze}>
            Generate New Maze
          </Button>
          <Button className="w-full mt-2" onClick={findSolution} variant="outline">
            Find Solution
          </Button>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <canvas ref={canvasRef} className="bg-white"></canvas>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Green dot = Start • Red dot = End</p>
      </div>
    </div>
  )
}
