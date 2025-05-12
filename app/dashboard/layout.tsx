"use client";

import Navbar from "../components/Navbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
