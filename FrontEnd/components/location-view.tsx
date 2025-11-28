import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchLocations, fetchUpcomingTasks, createLocation, updateLocation, deleteLocation, type Location } from "@/lib/api"

export function LocationView() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selected, setSelected] = useState<Location | null>(null)
  const [mapSrc, setMapSrc] = useState<string | null>(null)
  const [isCaregiverMode, setIsCaregiverMode] = useState(false)
  const [nextTaskTitle, setNextTaskTitle] = useState<string | null>(null)

  useEffect(() => {
    loadLocations()
    loadNext()
  }, [])

  async function loadLocations() {
    const locs = await fetchLocations()
    setLocations(locs)
    if (locs.length > 0) {
      setSelected(locs[0])
      if (locs[0].latitude && locs[0].longitude) {
        setMapSrc(makeMapUrl(locs[0].latitude, locs[0].longitude))
      }
    }
  }

  async function loadNext() {
    const tasks = await fetchUpcomingTasks(1)
    if (tasks && tasks.length > 0) {
      setNextTaskTitle(`${tasks[0].time} — ${tasks[0].title}`)
    } else {
      setNextTaskTitle(null)
    }
  }

  function makeMapUrl(lat: number, lon: number) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lon}`
  }

  function handleSelect(loc: Location) {
    setSelected(loc)
    if (loc.latitude && loc.longitude) setMapSrc(makeMapUrl(loc.latitude, loc.longitude))
  }

  async function handleTakeMeHome() {
    const home = locations.find((l) => l.place_type === 'home') || locations[0]
    if (!home) return
    handleSelect(home)
    // Show reassurance line
    alert(`You are here: ${home.label}${home.address ? `, ${home.address}` : ''}`)
  }

  async function handleAddLocation() {
    const label = prompt('Location label (e.g. "Anika\'s house")')
    if (!label) return
    const address = prompt('Address (optional)') || ''
    const lat = parseFloat(prompt('Latitude (optional)') || '')
    const lon = parseFloat(prompt('Longitude (optional)') || '')
    const place_type = prompt('Type (home, family, doctor)') || 'other'

    const created = await createLocation({ label, address, latitude: isNaN(lat) ? undefined : lat, longitude: isNaN(lon) ? undefined : lon, place_type })
    if (created) {
      loadLocations()
    }
  }

  async function handleEditLocation(loc: Location) {
    const label = prompt('New label', loc.label) || loc.label
    const address = prompt('Address', loc.address || '') || loc.address
    const latStr = prompt('Latitude', loc.latitude ? String(loc.latitude) : '')
    const lonStr = prompt('Longitude', loc.longitude ? String(loc.longitude) : '')
    const lat = latStr ? parseFloat(latStr) : undefined
    const lon = lonStr ? parseFloat(lonStr) : undefined
    const place_type = prompt('Type', loc.place_type || '') || loc.place_type

    const updated = await updateLocation(loc.id, { label, address, latitude: lat, longitude: lon, place_type })
    if (updated) loadLocations()
  }

  async function handleDeleteLocation(loc: Location) {
    if (!confirm(`Delete ${loc.label}?`)) return
    const ok = await deleteLocation(loc.id)
    if (ok) loadLocations()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Location</h1>
        <p className="text-xl md:text-2xl text-muted-foreground">Safe places and map controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card className="p-6 mb-4">
            <h3 className="text-2xl font-semibold mb-2">Where am I going next?</h3>
            {nextTaskTitle ? (
              <p className="text-xl font-bold">{nextTaskTitle}</p>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments</p>
            )}
          </Card>

          <Card className="p-6 mb-4">
            <h3 className="text-2xl font-semibold mb-2">Safe Places</h3>
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between gap-3">
                  <button className={`text-left p-3 rounded w-full ${selected?.id === loc.id ? 'bg-primary/10' : 'bg-muted/10'}`} onClick={() => handleSelect(loc)}>
                    <div className="font-semibold">{loc.label}</div>
                    {loc.address && <div className="text-sm text-muted-foreground">{loc.address}</div>}
                  </button>
                  {isCaregiverMode && (
                    <div className="flex gap-2 ml-2">
                      <button className="text-sm px-3 py-1 border rounded" onClick={() => handleEditLocation(loc)}>Edit</button>
                      <button className="text-sm px-3 py-1 border rounded text-red-600" onClick={() => handleDeleteLocation(loc)}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleTakeMeHome} variant="default">Take me home</Button>
              <Button variant="outline" onClick={() => setIsCaregiverMode(!isCaregiverMode)}>{isCaregiverMode ? 'Exit Edit' : 'Caregiver Edit Mode'}</Button>
              {isCaregiverMode && <Button variant="ghost" onClick={handleAddLocation}>Add</Button>}
            </div>
          </Card>

          {selected && (
            <Card className="p-6">
              <h3 className="text-2xl font-semibold">Selected</h3>
              <p className="font-bold text-xl">{selected.label}</p>
              {selected.address && <p className="text-muted-foreground">{selected.address}</p>}
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 mb-4">
            <h3 className="text-2xl font-semibold mb-2">Map</h3>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
              {mapSrc ? (
                <iframe src={mapSrc} className="w-full h-full" title="Map" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Map will appear when a location is selected</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
