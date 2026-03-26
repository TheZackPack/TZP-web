import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TZP - Modded Minecraft",
  description:
    "A modded Minecraft experience with an AI Dungeon Master. 170+ mods on NeoForge 1.21.1.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
