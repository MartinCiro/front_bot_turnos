import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'mrciro.com',
      'www.mrciro.com'
    ],
    host: '0.0.0.0',
    port: 4200,
    strictPort: true,
    cors: true,
  },
  preview: {
    allowedHosts: [
      'mrciro.com',
      'www.mrciro.com'
    ],
    host: '0.0.0.0',
    port: 4200
  }
})
