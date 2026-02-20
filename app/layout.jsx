import "./globals.css";
import AppChrome from "../components/AppChrome";

export const metadata = {
  title: "VibeCircle Journal",
  description: "Stories, strategies, and signals from the front lines of city culture, creator economy, and geo-social innovation.",
  icons: {
    icon: "/icon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppChrome>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
