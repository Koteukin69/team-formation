'use client';

import { useEffect, useState } from 'react'
import { UserRound, LogIn } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AccountMenu } from '@/components/account-menu'

export function AccountButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    mounted ? (
      <Popover>
        <PopoverTrigger asChild>
          <Button className="rounded-full h-10 w-10" variant="outline" size="icon-lg">
            <LogIn className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40" align="end" sideOffset={10} >
          <AccountMenu />
        </PopoverContent>
      </Popover>
    ) : (
      <Skeleton className="h-10 w-10 rounded-full" />
    )
  )
}