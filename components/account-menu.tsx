import { Button } from '@/components/ui/button';

export function AccountMenu({ userEmail }: { userEmail: string | null }) {

  return (
    userEmail ? (
      <div className="">
        <div className="flex justify-between items-center">
          {userEmail}
          <a href={"/logout"}><Button className={"w-20"} size={"sm"}>Выйти</Button></a>
        </div>
      </div>
    ) : (
      <div className="">
        <div className="flex justify-between items-center">
          Вы не авторизованы
          <a href={"/login"}><Button className={"w-20"} size={"sm"}>Войти</Button></a>
        </div>
      </div>
    )
  )
}