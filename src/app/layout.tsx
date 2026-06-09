import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // This is the outermost layout — next-intl handles lang/dir in [lang]/layout.tsx
  return children;
}
