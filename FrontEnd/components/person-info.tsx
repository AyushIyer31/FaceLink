import { Card } from "@/components/ui/card"
import type { Person } from "@/types"

interface PersonInfoProps {
  person: Person
}

export function PersonInfo({ person }: PersonInfoProps) {
  return (
    <Card className="p-8 bg-primary text-primary-foreground">
      <div className="space-y-4">
        <div>
          <p className="text-lg font-medium opacity-90">This is</p>
          <h3 className="text-5xl font-bold mt-1">{person.name}</h3>
        </div>
        <div>
          <p className="text-lg font-medium opacity-90">Your</p>
          <p className="text-3xl font-semibold">{person.relationship}</p>
        </div>
        <div className="pt-4 border-t border-primary-foreground/20">
          <p className="text-xl leading-relaxed">{person.reminder}</p>
        </div>
      </div>
    </Card>
  )
}
