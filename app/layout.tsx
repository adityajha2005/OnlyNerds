import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'OnlyNerds',
  description: 'Only Nerds is for builders, creators, and autodidacts who learn by doing.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
