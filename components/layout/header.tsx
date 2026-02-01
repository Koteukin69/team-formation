import { AccountButton } from "@/components/action/account-button";
import { ThemeToggle } from "../action/theme-toggle";
import { headers } from "next/headers";

export async function Header() {
  const headersList = await headers();
  const userEmail = headersList.get('x-user-email');

  return (
    <header>
      <div className="absolute top-5 left-5">
        <ThemeToggle />
      </div>
      <div className="absolute top-5 right-5">
        <AccountButton userEmail={userEmail} />
      </div>
    </header>
  )
}