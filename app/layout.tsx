import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Maze Generator',
  description: 'Simple maze generator',
  generator: 'jakeolo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
