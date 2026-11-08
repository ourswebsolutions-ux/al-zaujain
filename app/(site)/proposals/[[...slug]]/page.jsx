import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FilterPanel } from '@/components/listing/FilterPanel';
import { PageHeading } from '@/components/listing/PageHeading';
import { Pagination } from '@/components/listing/Pagination';
import { ProposalCard } from '@/components/profile/ProposalCard';
import { currentUser } from '@/lib/auth.js';
import { savedCodes } from '@/lib/engagement.js';
import { casteOptions, nationalityOptions } from '@/lib/places.js';
import { resolveScope, scopePlaces, scopeTabs } from '@/lib/proposal-scope.js';
import { parseFilters, searchProfiles } from '@/lib/search.js';
import { getT } from '@/lib/i18n/server.js';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = await resolveScope(slug);
  if (!resolved) return { title: 'Proposals' };
  return {
    title: resolved.title,
    description: resolved.category?.description ?? 'Browse verified rishta proposals on Al Zaujain Marriage Bureau.',
    alternates: { canonical: resolved.path },
  };
}

async function Tabs({ items, current }) {
  const t = await getT();
  return (
    <nav aria-label={t('Proposal locations')} className="flex flex-wrap gap-2 bg-cream px-[6%] pb-7">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item.href === current ? 'page' : undefined} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold no-underline transition-colors ${item.href === current ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-gold'}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function ProposalsPage({ params, searchParams }) {
  const t = await getT();
  const { slug } = await params;
  const query = await searchParams;
  const resolved = await resolveScope(slug);
  if (!resolved) notFound();

  const filters = parseFilters(query);
  const user = await currentUser();
  const saved = user?.role === 'user' ? await savedCodes(user.id) : null;
  const results = await searchProfiles(filters, resolved.scope);
  const tabs = (await scopeTabs(resolved)).map((item) => ({ href: item.href, label: item.all ? t('All {name}', { name: t(item.name) }) : t(item.name) }));

  const pageHref = (page) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== 'page' && typeof value === 'string' && value) next.set(key, value);
    }
    next.set('page', page);
    return `${resolved.path}?${next}`;
  };

  const { countryOptions, cityOptions } = await scopePlaces(resolved);
  const { category } = resolved;

  return (
    <main>
      <PageHeading tag="A GLIMPSE OF YOUR NEXT CHAPTER" title={resolved.title} urdu={category?.name_ur} text={category?.description ?? 'Search by name, caste, city, education and more. Every result is an approved proposal.'} />
      <Tabs items={tabs} current={resolved.path} />
      <div className="grid grid-cols-[300px_1fr] gap-8 px-[6%] py-12 max-p:grid-cols-[260px_1fr] max-b:grid-cols-1">
        <FilterPanel action={resolved.path} filters={filters} cities={cityOptions} countries={countryOptions} castes={await casteOptions()} nationalities={await nationalityOptions()} />
        <section aria-label={t('Results')} className="min-w-0">
          <p role="status" className="mb-5 text-sm font-semibold">{t(results.total === 1 ? '{count} proposal found' : '{count} proposals found', { count: results.total })}</p>
          {results.profiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-5 max-[1300px]:grid-cols-2 max-g:grid-cols-1">
              {results.profiles.map((profile) => <ProposalCard key={profile.code} profile={profile} tag={profile.verified ? 'Verified' : undefined} saved={saved?.has(profile.code)} />)}
            </div>
          ) : (
            <div className="rounded-[20px] border border-line bg-white p-10 text-center">
              <h2 className="font-quicksand text-xl font-bold">{t('No proposals match these filters yet')}</h2>
              <p className="mt-2 text-sm text-muted">{t('Try fewer filters, or speak to our team and we will look for you.')}</p>
            </div>
          )}
          <Pagination page={results.page} pages={results.pages} buildHref={pageHref} />
        </section>
      </div>
    </main>
  );
}
