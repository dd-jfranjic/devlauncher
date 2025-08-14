import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Welcome to {{NAME}}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            {{DESCRIPTION}}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          <div className="p-6 bg-card border rounded-lg space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Fast Development</h3>
            <p className="text-sm text-muted-foreground">
              Hot reload, TypeScript, and modern tooling for rapid development.
            </p>
          </div>

          <div className="p-6 bg-card border rounded-lg space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Docker Ready</h3>
            <p className="text-sm text-muted-foreground">
              Containerized development environment with optimal configuration.
            </p>
          </div>

          <div className="p-6 bg-card border rounded-lg space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Production Ready</h3>
            <p className="text-sm text-muted-foreground">
              Optimized build process and deployment configurations included.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="min-w-[150px]">
            Get Started
          </Button>
          <Button variant="outline" size="lg" className="min-w-[150px]">
            Learn More
          </Button>
        </div>

        <div className="mt-12 p-4 bg-muted/30 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Project: <code className="bg-muted px-2 py-1 rounded">{{SLUG}}</code> • 
            Location: <code className="bg-muted px-2 py-1 rounded">{{LOCATION}}</code> • 
            Runtime: <code className="bg-muted px-2 py-1 rounded">{{RUNTIME}}</code> • 
            Port: <code className="bg-muted px-2 py-1 rounded">{{HTTP_PORT}}</code>
          </p>
        </div>
      </div>
    </main>
  )
}