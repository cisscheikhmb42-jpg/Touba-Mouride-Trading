import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import type { LegalSection } from "@/content/legal";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { StarFrieze } from "@/components/ui/ornament";

export function LegalPage({
  locale,
  dict,
  title,
  href,
  sections,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  href: string;
  sections: LegalSection[];
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: title, href },
        ]}
      />
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <StarFrieze className="mt-4" count={3} />
      <p className="mt-6 rounded-2xl border border-[#f3d9a6] bg-[#fff8e8] p-4 text-sm text-warning">{dict.legal.reviewNotice}</p>
      {children}
      {/* Contenu juridique rédigé en français. */}
      <div lang="fr" className="prose-shop mt-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
