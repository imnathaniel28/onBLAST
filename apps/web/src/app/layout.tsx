import type { ReactNode } from "react";
import "./globals.css";
import { SiteNav } from "./nav";

export const metadata = {
  title: "onBLAST",
  description: "Community-driven business accountability.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
