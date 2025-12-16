import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs } from "@/../../lib/blog";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Subwise Blog`,
    description: post.description || post.title,
  };
}

function parseMarkdown(content: string): string {
  // Simple markdown to HTML conversion
  let html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4 text-white">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4 text-white">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-6 text-white">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li class="ml-6 list-disc text-slate-300">$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ml-6 list-decimal text-slate-300">$1</li>')
    // Blockquotes
    .replace(/^>\s*(.*)$/gim, '<blockquote class="border-l-4 border-emerald-500 pl-4 my-4 text-slate-400 italic">$1</blockquote>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm text-slate-300">$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-emerald-400">$1</code>')
    // Paragraphs
    .replace(/^(?!<[hluobpc]|$)(.+)$/gim, '<p class="text-slate-300 leading-relaxed mb-4">$1</p>');

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('list-decimal')) {
      return `<ol class="my-4 space-y-2">${match}</ol>`;
    }
    return `<ul class="my-4 space-y-2">${match}</ul>`;
  });

  return html;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const htmlContent = parseMarkdown(post.content);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-slate-400 hover:text-emerald-400 transition mb-8"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="mt-4 text-lg text-slate-400">{post.description}</p>
          )}
          <time className="mt-4 block text-sm text-slate-500">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </header>

        <div
          className="prose prose-invert prose-emerald max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {post.sources && post.sources.length > 0 && (
          <section className="mt-12 pt-8 border-t border-slate-800">
            <h2 className="text-xl font-semibold mb-4">Sources</h2>
            <ul className="space-y-2">
              {post.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 pt-8 border-t border-slate-800">
          <h2 className="text-xl font-semibold mb-4">Start Tracking Your Subscriptions</h2>
          <p className="text-slate-400 mb-6">
            Ready to take control of your recurring costs? Subwise helps you track,
            analyze, and optimize your subscriptions.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-full transition"
          >
            Get Started Free
          </Link>
        </section>
      </article>
    </main>
  );
}
