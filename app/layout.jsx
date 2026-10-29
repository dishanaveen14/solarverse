import './globals.css';

export const metadata = {
  title: 'SolarVerse — Interactive 3D & WebAR Solar System',
  description: 'Explore our planetary system in scientifically accurate 3D or project planets directly into your physical surroundings using Web Augmented Reality.',
  keywords: ['Solar System', 'WebAR', 'Three.js', 'Astronomy', 'Augmented Reality', 'Planets 3D'],
  authors: [{ name: 'SolarVerse Team' }]
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#070a13'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪐</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
