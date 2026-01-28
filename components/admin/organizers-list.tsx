'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddOrganizerDialog } from './add-organizer-dialog'
import { toast } from 'sonner'

interface Organizer {
  id: string
  email: string
  isCreator: boolean
}

interface OrganizersListProps {
  organizers: Organizer[]
  slug: string
  isCreator: boolean
}

export function OrganizersList({
  organizers: initialOrganizers,
  slug,
  isCreator,
}: OrganizersListProps) {
  const [organizers, setOrganizers] = useState(initialOrganizers)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const handleAddOrganizer = async (userId: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/organizers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при добавлении организатора')
      }

      // Fetch updated list
      const listRes = await fetch(`/api/marathons/${slug}/organizers`)
      if (listRes.ok) {
        const data = await listRes.json()
        setOrganizers(data.organizers)
      }

      toast.success('Организатор добавлен')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при добавлении')
      throw error
    }
  }

  const handleRemoveOrganizer = async (userId: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/organizers/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при удалении организатора')
      }

      // Update local state
      setOrganizers((prev) => prev.filter((o) => o.id !== userId))

      toast.success('Организатор удалён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при удалении')
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Организаторы марафона</h3>
        <Button onClick={() => setAddDialogOpen(true)}>Добавить организатора</Button>
      </div>

      <div className="grid gap-4">
        {organizers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет организаторов
            </CardContent>
          </Card>
        ) : (
          organizers.map((organizer) => (
            <Card key={organizer.id}>
              <CardContent className="flex justify-between items-center py-4">
                <div>
                  <p className="font-medium">{organizer.email}</p>
                  {organizer.isCreator && (
                    <Badge variant="secondary" className="mt-1">
                      Создатель
                    </Badge>
                  )}
                </div>
                {!organizer.isCreator && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveOrganizer(organizer.id)}
                  >
                    Удалить
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddOrganizerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddOrganizer}
      />
    </>
  )
}
