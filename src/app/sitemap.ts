import { MetadataRoute } from "next";
import { getAllPosts } from "@/../../lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://usesubwise.app";

  // Static pages
  const staticPages = [
    "",
    "/pricing",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/blog",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Blog posts
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = getAllPosts();
    blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // Blog posts not available during build
  }

  return [...staticPages, ...blogPosts];
}
