import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Late Payment Chaser",
  description: "Generate professional debt chasing letters citing UK statutory rights under the Late Payment of Commercial Debts (Interest) Act 1998.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#0a0a0a", color: "#e5e5e5" }}>
        {children}
      </body>
    </html>
  );
}
