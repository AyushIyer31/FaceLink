"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Plus, Check, X, Trash2, Camera, Upload } from "lucide-react"
import { fetchPeople, createPerson, updatePerson, deletePerson, uploadPersonPhoto, type Person } from "@/lib/api"
import { PhotoCaptureDialog } from "@/components/photo-capture-dialog"

export function PeopleList() {
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", relationship: "", reminder: "" })
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null)
  const [showCameraFor, setShowCameraFor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handlePhotoUpload(personId: string, imageBase64: string) {
    setUploadingPhotoFor(personId)
    const updatedPerson = await uploadPersonPhoto(personId, imageBase64)
    if (updatedPerson) {
      setPeople(people.map((p) => (p.id === personId ? updatedPerson : p)))
    }
    setUploadingPhotoFor(null)
  }

  function triggerFileInput(personId: string) {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.personId = personId
      fileInputRef.current.click()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const personId = e.target.dataset.personId
    if (file && personId) {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        handlePhotoUpload(personId, base64)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = '' // Reset input
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

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
                  <div className="flex gap-3 flex-1">
                    {/* Photo preview */}
                    {person.photo_url ? (
                      <img 
                        src={`http://localhost:3001${person.photo_url}`} 
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-xl font-semibold">{person.name}</p>
                      <p className="text-lg text-muted-foreground">{person.relationship}</p>
                      {person.reminder && (
                        <p className="text-sm text-muted-foreground mt-1 italic">{person.reminder}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {/* Camera capture button */}
                    <Button
                      onClick={() => setShowCameraFor(person.id)}
                      size="sm"
                      variant="ghost"
                      disabled={uploadingPhotoFor === person.id || editingId !== null || isAdding}
                      title="Take photo"
                    >
                      {uploadingPhotoFor === person.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span className="sr-only">Take photo of {person.name}</span>
                    </Button>
                    
                    {/* Upload photo button */}
                    <Button
                      onClick={() => triggerFileInput(person.id)}
                      size="sm"
                      variant="ghost"
                      disabled={uploadingPhotoFor === person.id || editingId !== null || isAdding}
                      title="Upload photo"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Upload photo for {person.name}</span>
                    </Button>
                    
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

      {/* Photo capture dialog */}
      {showCameraFor && (
        <PhotoCaptureDialog
          open={true}
          onClose={() => setShowCameraFor(null)}
          onCapture={(imageBase64) => {
            handlePhotoUpload(showCameraFor, imageBase64)
            setShowCameraFor(null)
          }}
          personName={people.find(p => p.id === showCameraFor)?.name || ''}
        />
      )}
    </Card>
  )
}
