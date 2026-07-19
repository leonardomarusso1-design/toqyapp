import Link from "next/link";
import { blogPosts, BlogPost } from "@/data/blogPosts";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post: BlogPost | undefined = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Post */}
      <section className="border-b border-border bg-card py-16">
        <div className="mx-auto max-w-4xl px-5">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar para o blog
          </Link>
          <div className="mt-8">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-extrabold text-accent">
                <Tag className="h-3 w-3" /> {post.category}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-extrabold text-muted">
                <Calendar className="h-3 w-3" /> {post.date}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-extrabold text-muted">
                <User className="h-3 w-3" /> {post.author}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Imagem do Post */}
      <div className="mx-auto max-w-6xl px-5 py-10">
        <img
          src={post.image}
          alt={post.title}
          className="h-80 w-full rounded-3xl object-cover"
        />
      </div>

      {/* Conteúdo do Post */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-5">
          <article
            className="prose prose-lg text-muted"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-3xl font-extrabold text-ink">
            Gostou do conteúdo?
          </h2>
          <p className="mt-3 text-muted">
            Crie o seu bio site profissional com o Toqy e comece a crescer o seu negócio hoje mesmo!
          </p>
          <Link href="/login" className="btn-glow mt-7 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold text-white">
            Criar bio site grátis
          </Link>
        </div>
      </section>
    </div>
  );
}

// Gerar caminhos estáticos para os posts do blog
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}
