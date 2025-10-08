import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/user-profile/',
          '/sign-in/',
          '/sign-up/',
          '/checkout/',
        ],
      },
    ],
    sitemap: 'https://usesubwise.app/sitemap.xml',
  }
}

