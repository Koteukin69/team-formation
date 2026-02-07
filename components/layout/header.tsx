import { AccountButton } from "@/components/action/account-button";
import { ThemeToggle } from "../action/theme-toggle";
import { headers } from "next/headers";

export async function Header() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  return (
    <header>
      <div className="absolute top-5 left-5">
        <ThemeToggle />
      </div>
      <div className="absolute top-5 right-5">
        <AccountButton userId={userId} />
      </div>
    </header>
  )
}