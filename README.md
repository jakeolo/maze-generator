# Maze Generator

A web application that procedurally generates and visualizes random mazes with customizable parameters. Users can create perfect mazes (with exactly one path between any two points) or add multiple solution paths by adjusting the edge density.

## Features

- Generate mazes of customizable width and height
- Adjust cell size for visualization
- Control edge density to create mazes with multiple solution paths
- Find and highlight the path from start to end
- Responsive web interface
- Built with Next.js and React

## Algorithm

The maze generation uses a depth-first search algorithm with backtracking:

1. Start from a random cell and mark it as visited
2. While there are unvisited cells:
   - If the current cell has unvisited neighbors:
     - Choose a random unvisited neighbor
     - Remove the wall between the current cell and the chosen neighbor
     - Mark the neighbor as visited and move to it
   - Else if the current cell has no unvisited neighbors:
     - Backtrack to the previous cell

For mazes with multiple solutions (edge density < 1), additional random walls are removed after generating the perfect maze.

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or pnpm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/jakeolo/maze-generator.git
   cd maze-generator
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Adjust the maze parameters:
   - Width and height control the dimensions of the maze
   - Cell size adjusts the visual size of each cell
   - Edge density controls how many paths exist (1.00 = perfect maze with one solution)

2. Click "Generate New Maze" to create a new random maze with the current settings

3. Click "Find Solution" to highlight a path from the start (green) to the end (red)

## Building for Production

```bash
npm run build
# or
pnpm build
```

Then start the production server:

```bash
npm start
# or
pnpm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by various maze generation algorithms and techniques
- UI components from [shadcn/ui](https://ui.shadcn.com/) 