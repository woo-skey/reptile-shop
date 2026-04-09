import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '파충류가게',
    short_name: '파충류가게',
    description: '파충류가게 단골들의 공간',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A1A0F',
    theme_color: '#1A1A0F',
    icons: [
      {
        src: '/reptile_icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
    ],
  }
}
