import Link from "next/link";
import { getAllPosts } from "@/../../lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Subwise - Subscription Tracker",
  description:
    "Tips, guides, and insights on managing your subscriptions, saving money, and taking control of recurring costs.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Tips, guides, and insights on managing your subscriptions and saving
            money.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-slate-400">No posts yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900/80"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-2 text-slate-400 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  <time className="mt-3 block text-sm text-slate-500">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
