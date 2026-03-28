import "./globals.css";
import Script from 'next/script';

export const metadata = {
  title: "AI Showcase",
  description: "Showcasing the future of AI and web design",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://unpkg.com/@splinetool/viewer@1.0.51/build/spline-viewer.js" 
          type="module"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
