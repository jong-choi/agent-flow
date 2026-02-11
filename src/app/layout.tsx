import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentflow.jongchoi.com/"),
  title: "AgentFlow",
  description: "랭그래프를 플로우 차트로 만드는 사이트",
  keywords: ["AgentFlow", "LangGraph", "flow chart", "랭그래프", "플로우차트"],
  authors: [{ name: "AgentFlow Team" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    title: "AgentFlow",
    description: "랭그래프를 플로우 차트로 만드는 사이트",
    siteName: "AgentFlow",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow",
    description: "랭그래프를 플로우 차트로 만드는 사이트",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "android-chrome",
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "android-chrome",
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
