{
  "name": "blinkgo",
  "version": "1.0.0",
  "private": true,
  "description": "BlinkGo MVP — Food delivery platform (monorepo)",
  "workspaces": ["web"],
  "scripts": {
    "dev": "npm --workspace web run dev",
    "build": "npm --workspace web run build",
    "start": "npm --workspace web run start",
    "lint": "npm --workspace web run lint",
    "typecheck": "npm --workspace web run typecheck"
  },
  "engines": {
    "node": ">=18.18.0"
  }
}