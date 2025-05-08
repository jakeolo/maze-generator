// Update the Cell class to export it so it can be imported in page.tsx
export class Cell {
  x: number
  y: number
  links: {
    north: boolean
    east: boolean
    south: boolean
    west: boolean
  }
  visited: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.links = {
      north: false,
      east: false,
      south: false,
      west: false,
    }
    this.visited = false
  }
}

// Maze class handles maze generation
export class Maze {
  width: number
  height: number
  grid: Cell[][]
  edgeDensity: number

  constructor(width: number, height: number, edgeDensity = 1) {
    this.width = width
    this.height = height
    this.edgeDensity = Math.min(Math.max(edgeDensity, 0.5), 1) // Clamp between 0.5 and 1
    this.grid = this.initializeGrid()
  }

  // Initialize the grid with cells
  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = []

    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = []
      for (let x = 0; x < this.width; x++) {
        row.push(new Cell(x, y))
      }
      grid.push(row)
    }

    return grid
  }

  // Get a cell at specific coordinates
  private getCell(x: number, y: number): Cell | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return null
    }
    return this.grid[y][x]
  }

  // Get unvisited neighbors of a cell
  private getUnvisitedNeighbors(cell: Cell): { cell: Cell; direction: string }[] {
    const neighbors: { cell: Cell; direction: string }[] = []

    const north = this.getCell(cell.x, cell.y - 1)
    const east = this.getCell(cell.x + 1, cell.y)
    const south = this.getCell(cell.x, cell.y + 1)
    const west = this.getCell(cell.x - 1, cell.y)

    if (north && !north.visited) neighbors.push({ cell: north, direction: "north" })
    if (east && !east.visited) neighbors.push({ cell: east, direction: "east" })
    if (south && !south.visited) neighbors.push({ cell: south, direction: "south" })
    if (west && !west.visited) neighbors.push({ cell: west, direction: "west" })

    return neighbors
  }

  // Link two cells by removing the wall between them
  private linkCells(cell1: Cell, cell2: Cell, direction: string): void {
    switch (direction) {
      case "north":
        cell1.links.north = true
        cell2.links.south = true
        break
      case "east":
        cell1.links.east = true
        cell2.links.west = true
        break
      case "south":
        cell1.links.south = true
        cell2.links.north = true
        break
      case "west":
        cell1.links.west = true
        cell2.links.east = true
        break
    }
  }

  // Generate the maze using depth-first search with backtracking
  generate(): void {
    // Reset the grid
    this.grid = this.initializeGrid()

    // Validate grid dimensions
    if (this.width <= 0 || this.height <= 0 || !this.grid || this.grid.length === 0) {
      console.error("Invalid maze dimensions")
      return
    }

    // Start with the cell at (0, 0)
    const startCell = this.grid[0][0]
    if (!startCell) {
      console.error("Start cell is undefined")
      return
    }

    startCell.visited = true

    // Stack for backtracking
    const stack: Cell[] = [startCell]

    // Continue until all cells are visited
    while (stack.length > 0) {
      const currentCell = stack[stack.length - 1]
      const neighbors = this.getUnvisitedNeighbors(currentCell)

      if (neighbors.length === 0) {
        // No unvisited neighbors, backtrack
        stack.pop()
      } else {
        // Choose a random unvisited neighbor
        const randomIndex = Math.floor(Math.random() * neighbors.length)
        const { cell: nextCell, direction } = neighbors[randomIndex]

        // Link the current cell with the chosen neighbor
        this.linkCells(currentCell, nextCell, direction)

        // Mark the neighbor as visited and add it to the stack
        nextCell.visited = true
        stack.push(nextCell)
      }
    }

    // Add additional paths based on edge density
    if (this.edgeDensity < 1) {
      this.addAdditionalPaths()
    }
  }

  // Add additional paths to create a maze with multiple solutions
  private addAdditionalPaths(): void {
    if (!this.grid || this.grid.length === 0) return

    const totalPossibleWalls = (this.width - 1) * this.height + (this.height - 1) * this.width
    const existingPaths = this.width * this.height - 1 // A perfect maze has n-1 paths for n cells

    // Calculate how many additional paths to add based on edge density
    const additionalPathsToAdd = Math.floor((1 - this.edgeDensity) * (totalPossibleWalls - existingPaths))

    for (let i = 0; i < additionalPathsToAdd; i++) {
      // Choose a random cell
      const x = Math.floor(Math.random() * this.width)
      const y = Math.floor(Math.random() * this.height)

      // Ensure valid coordinates
      if (y >= 0 && y < this.grid.length && x >= 0 && this.grid[y] && x < this.grid[y].length) {
        const cell = this.grid[y][x]

        // Choose a random direction
        const directions = ["north", "east", "south", "west"]
        const randomDirection = directions[Math.floor(Math.random() * directions.length)]

        let neighbor: Cell | null = null

        switch (randomDirection) {
          case "north":
            neighbor = this.getCell(x, y - 1)
            break
          case "east":
            neighbor = this.getCell(x + 1, y)
            break
          case "south":
            neighbor = this.getCell(x, y + 1)
            break
          case "west":
            neighbor = this.getCell(x - 1, y)
            break
        }

        // If there's a neighbor and they're not already linked, link them
        if (neighbor && !cell.links[randomDirection as keyof typeof cell.links]) {
          this.linkCells(cell, neighbor, randomDirection)
        }
      }
    }
  }

  // Find a path from start to end using DFS
  findPath(): Cell[] {
    if (!this.grid || this.grid.length === 0) return []

    const startCell = this.grid[0][0]
    const endCell = this.grid[this.height - 1][this.width - 1]

    if (!startCell || !endCell) return []

    // Reset visited status for all cells
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          this.grid[y][x].visited = false
        }
      }
    }

    // Stack for DFS
    const stack: Cell[] = [startCell]
    // Map to keep track of the path
    const cameFrom = new Map<Cell, Cell>()

    startCell.visited = true

    while (stack.length > 0) {
      const current = stack.pop()!

      // If we reached the end cell, reconstruct and return the path
      if (current === endCell) {
        return this.reconstructPath(cameFrom, startCell, endCell)
      }

      // Check all four directions
      const directions = [
        { dx: 0, dy: -1, dir: "north" },
        { dx: 1, dy: 0, dir: "east" },
        { dx: 0, dy: 1, dir: "south" },
        { dx: -1, dy: 0, dir: "west" },
      ]

      for (const { dx, dy, dir } of directions) {
        const nx = current.x + dx
        const ny = current.y + dy
        const neighbor = this.getCell(nx, ny)

        // If there's a valid neighbor and there's a path (no wall) between them
        if (neighbor && !neighbor.visited && current.links[dir as keyof typeof current.links]) {
          neighbor.visited = true
          cameFrom.set(neighbor, current)
          stack.push(neighbor)
        }
      }
    }

    // No path found
    return []
  }

  // Reconstruct the path from start to end
  private reconstructPath(cameFrom: Map<Cell, Cell>, start: Cell, end: Cell): Cell[] {
    const path: Cell[] = [end]
    let current = end

    while (current !== start) {
      const previous = cameFrom.get(current)
      if (!previous) break
      path.unshift(previous)
      current = previous
    }

    return path
  }
}
