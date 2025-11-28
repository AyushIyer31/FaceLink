"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Plus, Check, X, Trash2 } from "lucide-react"
import { fetchPeople, createPerson, updatePerson, deletePerson, type Person } from "@/lib/api"

export function PeopleList() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", relationship: "", reminder: "" })

  useEffect(() => {
    loadPeople()
  }, [])

  async function loadPeople() {
    setIsLoading(true)
    const data = await fetchPeople()
    setPeople(data)
    setIsLoading(false)
  }

  function startEdit(person: Person) {
    setEditingId(person.id)
    setEditForm({
      name: person.name,
      relationship: person.relationship,
      reminder: person.reminder,
    })
  }

  async function saveEdit() {
    if (!editingId) return
    const updated = await updatePerson(editingId, editForm)
    if (updated) {
      setPeople(people.map((p) => (p.id === editingId ? updated : p)))
    }
    setEditingId(null)
  }

  function startAdd() {
    setIsAdding(true)
    setEditForm({ name: "", relationship: "", reminder: "" })
  }

  async function saveNew() {
    const newPerson = await createPerson(editForm)
    if (newPerson) {
      setPeople([...people, newPerson])
    }
    setIsAdding(false)
  }

  async function handleDelete(id: string) {
    const success = await deletePerson(id)
    if (success) {
      setPeople(people.filter((p) => p.id !== id))
    }
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

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : people.length === 0 && !isAdding ? (
        <p className="text-muted-foreground">No people added yet. Click Add to get started.</p>
      ) : (
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
                    {person.reminder && (
                      <p className="text-sm text-muted-foreground mt-1 italic">{person.reminder}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEdit(person)}
                      size="sm"
                      variant="ghost"
                      disabled={editingId !== null || isAdding}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {person.name}</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(person.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={editingId !== null || isAdding}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {person.name}</span>
                    </Button>
                  </div>
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
      )}
    </Card>
  )
}
