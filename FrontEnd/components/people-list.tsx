"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Plus, Check, X } from "lucide-react"
import type { Person } from "@/types"

interface PeopleListProps {
  people: Person[]
  onUpdate: (people: Person[]) => void
}

export function PeopleList({ people, onUpdate }: PeopleListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", relationship: "", reminder: "" })

  function startEdit(person: Person) {
    setEditingId(person.id)
    setEditForm({
      name: person.name,
      relationship: person.relationship,
      reminder: person.reminder,
    })
  }

  function saveEdit() {
    if (!editingId) return
    onUpdate(people.map((p) => (p.id === editingId ? { ...p, ...editForm } : p)))
    setEditingId(null)
  }

  function startAdd() {
    setIsAdding(true)
    setEditForm({ name: "", relationship: "", reminder: "" })
  }

  function saveNew() {
    const newPerson: Person = {
      id: Date.now().toString(),
      ...editForm,
    }
    onUpdate([...people, newPerson])
    setIsAdding(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsAdding(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">People</h2>
        <Button onClick={startAdd} size="sm" variant="outline" disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <ul className="space-y-4" role="list">
        {people.map((person) => (
          <li key={person.id} className="border rounded-lg p-4">
            {editingId === person.id ? (
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Name"
                  className="text-lg"
                />
                <Input
                  value={editForm.relationship}
                  onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                  placeholder="Relationship"
                />
                <Input
                  value={editForm.reminder}
                  onChange={(e) => setEditForm({ ...editForm, reminder: e.target.value })}
                  placeholder="Reminder"
                />
                <div className="flex gap-2">
                  <Button onClick={saveEdit} size="sm" className="flex-1">
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline" className="flex-1 bg-transparent">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xl font-semibold">{person.name}</p>
                  <p className="text-lg text-muted-foreground">{person.relationship}</p>
                </div>
                <Button
                  onClick={() => startEdit(person)}
                  size="sm"
                  variant="ghost"
                  disabled={editingId !== null || isAdding}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit {person.name}</span>
                </Button>
              </div>
            )}
          </li>
        ))}

        {isAdding && (
          <li className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-3">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Name"
                className="text-lg"
              />
              <Input
                value={editForm.relationship}
                onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                placeholder="Relationship"
              />
              <Input
                value={editForm.reminder}
                onChange={(e) => setEditForm({ ...editForm, reminder: e.target.value })}
                placeholder="Reminder"
              />
              <div className="flex gap-2">
                <Button onClick={saveNew} size="sm" className="flex-1">
                  <Check className="h-4 w-4 mr-1" />
                  Add Person
                </Button>
                <Button onClick={cancelEdit} size="sm" variant="outline" className="flex-1 bg-transparent">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </li>
        )}
      </ul>
    </Card>
  )
}
