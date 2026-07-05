{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["fra1"],
  "buildCommand": "cd web && npm run build",
  "installCommand": "cd web && npm install",
  "devCommand": "cd web && npm run dev",
  "outputDirectory": "web/.next",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}