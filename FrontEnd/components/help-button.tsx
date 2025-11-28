"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { triggerHelp, fetchSettings, type Caregiver, type Settings } from "@/lib/api"

export function HelpButton() {
  const [showHelp, setShowHelp] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [reassuranceMessage, setReassuranceMessage] = useState("You are safe at home. Everything is okay.")
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const data = await fetchSettings()
      if (data) {
        setSettings(data)
        setReassuranceMessage(data.reassurance_message)
        setCaregivers(data.caregivers)
      }
    }
    loadSettings()
  }, [])

  async function handleHelpClick() {
    setIsLoading(true)
    setShowHelp(true)
    
    // Call the help API to log the event and get fresh data
    const helpData = await triggerHelp()
    if (helpData) {
      setReassuranceMessage(helpData.message)
      setCaregivers(helpData.caregivers)
    }
    setIsLoading(false)
  }

  function callCaregiver(caregiver: Caregiver) {
    // In a real app, this would initiate a phone call
    window.location.href = `tel:${caregiver.phone_number}`
  }

  function textCaregiver(caregiver: Caregiver) {
    // In a real app, this would open SMS
    window.location.href = `sms:${caregiver.phone_number}`
  }

  // Get primary caregiver and others
  const primaryCaregiver = caregivers.find(c => c.is_primary)
  const otherCaregivers = caregivers.filter(c => !c.is_primary)

  return (
    <>
      <Button
        onClick={handleHelpClick}
        size="lg"
        variant="destructive"
        className="w-full text-2xl md:text-3xl py-10 font-bold bg-orange-600 hover:bg-orange-700"
        aria-label="Get help if you're confused"
      >
        I'm Confused / Help
      </Button>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl p-8">
          <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-950 p-8 rounded-lg border-4 border-primary">
              {isLoading ? (
                <p className="text-2xl text-center">Loading...</p>
              ) : (
                <>
                  <p className="text-3xl md:text-4xl font-bold text-center leading-relaxed">
                    {reassuranceMessage}
                  </p>
                  {settings?.home_label && (
                    <p className="text-2xl md:text-3xl text-center mt-4 text-muted-foreground">
                      You are at: {settings.home_label}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-semibold text-center">Contact Someone</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {primaryCaregiver && (
                  <>
                    <Button 
                      onClick={() => callCaregiver(primaryCaregiver)} 
                      size="lg" 
                      className="text-xl py-8 font-semibold bg-green-600 hover:bg-green-700"
                    >
                      📞 Call {primaryCaregiver.name}
                    </Button>
                    <Button
                      onClick={() => textCaregiver(primaryCaregiver)}
                      size="lg"
                      variant="outline"
                      className="text-xl py-8 font-semibold"
                    >
                      💬 Text {primaryCaregiver.name}
                    </Button>
                  </>
                )}
                {otherCaregivers.map((caregiver) => (
                  <Button 
                    key={caregiver.id}
                    onClick={() => callCaregiver(caregiver)} 
                    size="lg" 
                    className="text-xl py-8 font-semibold"
                  >
                    📞 Call {caregiver.name}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={() => setShowHelp(false)} variant="outline" size="lg" className="w-full text-xl py-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
