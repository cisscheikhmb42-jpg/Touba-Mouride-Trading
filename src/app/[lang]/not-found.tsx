import Link from "next/link";
import { lang } from "next/root-params";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { EightPointStar } from "@/components/ui/ornament";

export default async function NotFound() {
  const value = await lang();
  const locale = isLocale(value) ? value : "fr";
  const dict = getDictionary(locale);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <EightPointStar className="size-10 text-gold-bright" />
      <p className="mt-6 font-display text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-md text-muted">{dict.notFound.text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={paths.home(locale)} className="btn btn-dark">
          {dict.notFound.back}
        </Link>
        <Link href={paths.shop(locale)} className="btn btn-outline">
          {dict.notFound.shop}
        </Link>
      </div>
    </div>
  );
}
