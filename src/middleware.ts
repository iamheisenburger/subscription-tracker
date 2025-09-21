import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

// Exclude static assets (like manifest.json) from auth to avoid 401s
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|icons|manifest.json|robots.txt|sitemap.xml|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|webp|ico|txt)).*)',
    '/(api|trpc)(.*)'
  ],
};


