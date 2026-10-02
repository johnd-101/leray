import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuickStack',
    short_name: 'QuickStack',
    description: 'Notes, Appointments, Reminders with background notifications',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0E14',
    theme_color: '#6366f1',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }]
  }
}