import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Post Generator",
  description: "Generate platform-specific social media captions for your business in seconds.",
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
