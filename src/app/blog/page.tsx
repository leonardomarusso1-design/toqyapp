import Link from "next/link";
import { blogPosts } from "@/data/blogPosts";
import { ArrowRight, Calendar, User, Tag } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero do Blog */}
      <section className="border-b border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Blog</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Dicas para o seu <span className="gradient-text">negócio</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Conteúdos práticos para você crescer o seu negócio local, vender mais e automatizar processos.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de Posts */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-extrabold text-accent">
                      <Tag className="h-3 w-3" /> {post.category}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-extrabold text-muted">
                      <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold text-ink group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm text-muted">{post.excerpt}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-accent">
                    Ler mais <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
