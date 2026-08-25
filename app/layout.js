import './globals.css';
export const metadata = {
  title: 'JUT Analytics - NEET Performance Dashboard',
  description: 'Track your Jnanasudha JUT performance',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
