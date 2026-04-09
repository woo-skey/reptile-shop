import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Reptile Shop',
    short_name: 'Reptile',
    description: 'Community for Reptile Shop regulars',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A1A0F',
    theme_color: '#1A1A0F',
    icons: [
      {
        src: '/reptile_icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}
