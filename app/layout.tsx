import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Отчётность — Construction Finance",
  description: "Прототип фаз 1–2 продукта Отчётность"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}