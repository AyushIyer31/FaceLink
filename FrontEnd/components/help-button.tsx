"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function HelpButton() {
  const [showHelp, setShowHelp] = useState(false)

  function callCaregiver(name: string) {
    alert(`Calling ${name}...`)
  }

  function textCaregiver(name: string) {
    alert(`Sending text to ${name}...`)
  }

  return (
    <>
      <Button
        onClick={() => setShowHelp(true)}
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
              <p className="text-3xl md:text-4xl font-bold text-center leading-relaxed">You are at home.</p>
              <p className="text-2xl md:text-3xl text-center mt-4 text-muted-foreground">Anika is in the next room.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-semibold text-center">Contact Someone</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => callCaregiver("Anika")} size="lg" className="text-xl py-8 font-semibold">
                  Call Anika
                </Button>
                <Button
                  onClick={() => textCaregiver("Anika")}
                  size="lg"
                  variant="outline"
                  className="text-xl py-8 font-semibold"
                >
                  Text Anika
                </Button>
                <Button onClick={() => callCaregiver("Ravi")} size="lg" className="text-xl py-8 font-semibold">
                  Call Ravi
                </Button>
                <Button
                  onClick={() => textCaregiver("Ravi")}
                  size="lg"
                  variant="outline"
                  className="text-xl py-8 font-semibold"
                >
                  Text Ravi
                </Button>
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
