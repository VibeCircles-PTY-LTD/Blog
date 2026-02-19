"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Nav />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
