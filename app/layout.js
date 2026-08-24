import './globals.css'

export const metadata = {
  title: 'JUT Analytics',
  description: 'NEET Performance Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}