import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/schools',
        '/learning-centers',
        '/register-school',
        '/pricing',
        '/for-schools',
        '/contact',
        '/products'
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard',
        '/settings',
        '/student-management',
        '/fee-management',
        '/campaign-management',
        '/lead-management',
        '/notifications',
        '/onboarding',
        '/parent/',
        '/roles',
        '/users',
        '/forgot-pin',
        '/login',
        '/register'
      ],
    },
    sitemap: 'https://vidhyaan.com/sitemap.xml',
  }
}
