import type { Metadata } from "next";
import Config from "@/config";

export const metadata: Metadata = {
  title: `${Config.name} - Марафоны`,
  description: "Список всех марафонов",
};

export default function MarathonsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="p-10 sm:p-20">
      {children}
    </div>
  );
}
