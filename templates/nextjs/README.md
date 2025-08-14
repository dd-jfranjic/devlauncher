# {{NAME}}

{{DESCRIPTION}}

## Project Information

- **Name:** {{NAME}}
- **Slug:** {{SLUG}}
- **Type:** Next.js React Application
- **Location:** {{LOCATION}}
- **Runtime:** {{RUNTIME}}
- **Port:** {{HTTP_PORT}}

## Getting Started

### Development with Docker (Recommended)

1. **Start the development server:**
   ```bash
   docker compose up -d
   ```

2. **View the application:**
   - Open [http://localhost:{{HTTP_PORT}}](http://localhost:{{HTTP_PORT}}) in your browser
   - The application will hot reload when you make changes

3. **Stop the server:**
   ```bash
   docker compose down
   ```

### Development with Node.js (Windows only)

If you're on Windows and prefer to run Node.js directly:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **View the application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
{{SLUG}}/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   └── components/         # React components
│       └── ui/             # UI components
├── public/                 # Static assets
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
└── .devlauncher.json       # Dev Launcher config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Docker Commands

- `docker compose up -d` - Start in detached mode
- `docker compose down` - Stop and remove containers
- `docker compose logs -f` - Follow logs
- `docker compose exec app bash` - Access container shell

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Container:** [Docker](https://www.docker.com/)

## Performance Notes

{{#if (eq LOCATION "windows")}}
**Windows Location Detected:**
- Docker bind mounts may be slower on Windows NTFS
- Consider using WSL location for better Docker performance
- File watching is configured with polling for Windows compatibility
{{/if}}

{{#if (eq LOCATION "wsl")}}
**WSL Location Detected:**
- Optimal Docker performance with native file system
- Fast file watching without polling
- Best development experience
{{/if}}

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Deployment

This Next.js application can be deployed to various platforms:

- [Vercel](https://vercel.com/) (recommended)
- [Netlify](https://www.netlify.com/)
- [AWS](https://aws.amazon.com/)
- [Docker](https://www.docker.com/) (production build)