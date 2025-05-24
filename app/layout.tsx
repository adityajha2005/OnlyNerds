import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'OnlyNerds',
  description: 'The decentralized AI-powered learning platform for real ones.',
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
