# VibeCircle Blog

Next.js blog app backed by Sanity CMS. The Sanity Studio is mounted at `/studio` in the app.

**Tech Stack**
- Next.js 14 (App Router)
- React 18
- Sanity v3 + next-sanity

**Getting Started**
1. Install dependencies: `npm install`
2. Create a local env file: `Copy-Item .env.example .env.local`
3. Fill in values in `.env.local`
4. Start the dev server: `npm run dev`
5. Open the app at `http://localhost:3000`
6. Open Sanity Studio at `http://localhost:3000/studio`

**Environment Variables**
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_READ_TOKEN`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

See `.env.example` for details.

**Scripts**
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting

**Deployment**
This project is set up for Vercel. Ensure the same environment variables are configured in the deployment environment.
