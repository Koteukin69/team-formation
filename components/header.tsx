import { AccountButton } from "./account-button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header>
      <div className="absolute top-5 left-5">
        <ThemeToggle />
      </div>
      <div className="absolute top-5 right-5">
        <AccountButton />
      </div>
    </header>
  )
}