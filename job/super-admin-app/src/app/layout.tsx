import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "JobDozo — Super Admin Portal",
  description: "Manage jobs, applications, interviews and hiring on JobDozo.",
  icons: { icon: "/super-admin/icon.png", apple: "/super-admin/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('jm_theme')||'light';document.documentElement.dataset.theme=t;}catch(e){}})();` }} />
      </head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
