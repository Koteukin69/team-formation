import { Button } from '@/components/ui/button';

export function AccountMenu({ userId }: { userId: string | null }) {

  return (
    <div className="flex gap-5 items-center">
      {userId ? (
        <>
          {userId}
          <a href={"/logout"}><Button size={"sm"}>Выйти</Button></a>
        </>
      ) : (
        <>
          Вы не авторизованы
          <a href={"/login"}><Button size={"sm"}>Войти</Button></a>
        </>
      )}
    </div>
  )
}