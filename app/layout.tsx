import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordle Multiplayer",
  description: "Real-time multiplayer Wordle - Challenge your friends!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
