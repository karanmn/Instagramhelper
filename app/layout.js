import './globals.css';

export const metadata = {
  title: 'Instagram Agent Suite',
  description: 'AI Agent skills for Instagram creators & profile audits',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
