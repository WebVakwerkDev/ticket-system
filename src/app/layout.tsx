import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "Agency OS",
  description: "Interne webapp voor agency-projectbeheer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
