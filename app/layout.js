import "./globals.css";

export const metadata = {
  title: "Hope Inc. ERP",
  description: "Hope Inc. ERP application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
