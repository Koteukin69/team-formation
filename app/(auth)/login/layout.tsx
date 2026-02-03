import type { Metadata } from "next";
import Config from "@/config";

export const metadata: Metadata = {
  title: `${Config.name} - Авторизация`,
  description: "Войдите в систему для управления командами",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
