// Root layout
//  - next/font โหลดฟอนต์ "ครั้งเดียวทั้งแอป" แล้ว expose เป็น CSS variable
//  - <html data-theme="cafe"> = ค่าเริ่มต้น (SSR) ; ThemeScript จะแก้ก่อน paint ตาม localStorage
//  - suppressHydrationWarning เพราะ data-theme/.dark ถูก mutate โดย script ฝั่ง client
import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import "@/public/styles/index.css";

import {
  ThemeProvider,
  ThemeScript,
} from "@/src/presentation/providers/theme-provider";
import { ToastProvider } from "@/src/presentation/components/ui/toast/ToastProvider";

// body face — ใช้ทุกธีม
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

// serif display face — heading ของธีม "retro" เท่านั้น (โหลด global, ธีมอื่นไม่เรียกใช้)
const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-noto-serif-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odoo ERP",
  description: "ระบบ ERP สำหรับธุรกิจของคุณ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      data-theme="cafe"
      className={`${notoSansThai.variable} ${notoSerifThai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
