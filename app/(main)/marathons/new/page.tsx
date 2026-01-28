import { CreateMarathonForm } from '@/components/marathon/create-marathon-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Создать марафон | Team Formation',
  description: 'Создайте новый марафон или хакатон для формирования команд',
}

export default function CreateMarathonPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Создать марафон</h1>
        <p className="text-muted-foreground mb-8">
          Создайте площадку для формирования команд на вашем мероприятии
        </p>
        <CreateMarathonForm />
      </div>
    </div>
  )
}
