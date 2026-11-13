import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const inter = localFont({
  src: "./fonts/inter-latin-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "400 700",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial"],
});

export const metadata = {
  title: {
    default: "Hope, Inc. ERP",
    template: "%s · Hope, Inc. ERP",
  },
  description:
    "Customer records, product catalogue and the dated price history that drives every quote.",
  applicationName: "Hope, Inc. ERP",
};

export const viewport = {
  themeColor: "#f2f1ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable} lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
