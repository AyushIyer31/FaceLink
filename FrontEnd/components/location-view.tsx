import { Card } from "@/components/ui/card"

export function LocationView() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 md:p-8">
        <header className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Where You Are</h2>
        </header>

        <div className="space-y-8">
          <div className="bg-green-50 dark:bg-green-950 p-8 rounded-lg border-4 border-green-600">
            <p className="text-4xl md:text-5xl font-bold text-center text-green-900 dark:text-green-100">
              You are at home
            </p>
          </div>

          <Card className="p-6 bg-muted/50">
            <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">Your Address</h3>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">
              742 Maple Street
              <br />
              Seattle, WA 98102
              <br />
              United States
            </p>
          </Card>

          <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-122.3320%2C47.6230%2C-122.3220%2C47.6330&layer=mapnik&marker=47.6280%2C-122.3270"
              className="w-full h-full"
              title="Map showing your current location"
              loading="lazy"
            />
          </div>

          <Card className="p-6 bg-blue-50 dark:bg-blue-950">
            <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">Important Locations</h3>
            <ul className="space-y-3 text-xl md:text-2xl">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Dr. Lee's office: 3 blocks north on Maple Street</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Grocery store: Corner of Maple and Oak (5 minute walk)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Anika's house: 15 minute drive (call for directions)</span>
              </li>
            </ul>
          </Card>
        </div>
      </Card>
    </div>
  )
}
