import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Coblos Aku - E-Voting',
        short_name: 'CoblosAku',
        description: 'Aplikasi E-Voting Terpercaya',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/coblosaku.png', // Menggunakan logo yang diupload
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/coblosaku.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/coblosaku.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/', 
})