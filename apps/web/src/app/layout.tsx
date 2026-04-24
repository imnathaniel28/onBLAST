import type { ReactNode } from "react";

export const metadata = {
  title: "onBLAST",
  description: "Community-driven business accountability.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          margin: 0,
          padding: "2rem",
          maxWidth: 720,
          marginInline: "auto",
        }}
      >
        {children}
      </body>
    </html>
  );
}
