export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Fiskal AI
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Modern invoicing system built with Next.js, NestJS, and PostgreSQL
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Frontend</h2>
            <p className="text-gray-600">Next.js 15.4 with React 19</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Backend</h2>
            <p className="text-gray-600">NestJS 11 with Prisma ORM</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Database</h2>
            <p className="text-gray-600">PostgreSQL 17 with Redis cache</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <a
            href={`http://localhost:{{BACKEND_PORT}}/api/docs`}
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View API Documentation →
          </a>
        </div>
      </div>
    </main>
  )
}