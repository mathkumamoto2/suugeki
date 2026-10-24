import "katex/dist/katex.min.css";
import "./globals.css";
import type { Metadata } from "next";
import { AppChrome } from "@/components/AppChrome";

export const metadata: Metadata = {
  title: "数隙 v10 Learning Flow",
  description: "解説から自力再現まで一本化した微積学習アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
