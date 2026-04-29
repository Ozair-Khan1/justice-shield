import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Resources — Justice Shield",
  description: "U.S. police violence and incarceration statistics that make on-demand legal protection essential.",
};

type Stat = { value: string; label: string; source: string; sourceUrl: string };

const policeStats: Stat[] = [
  { value: "1,260+", label: "People killed by U.S. police in 2024 — the highest annual total on record.", source: "Mapping Police Violence", sourceUrl: "https://mappingpoliceviolence.org/" },
  { value: "3 / day", label: "Average number of people killed by police every day in the United States.", source: "Mapping Police Violence", sourceUrl: "https://mappingpoliceviolence.org/" },
  { value: "2.9×", label: "Black Americans are nearly 3× more likely to be killed by police than white Americans.", source: "The Lancet (2021)", sourceUrl: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(21)01609-3/fulltext" },
  { value: "55,000+", label: "Police killings in the U.S. between 1980 and 2018 estimated to be misclassified or unreported.", source: "The Lancet (2021)", sourceUrl: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(21)01609-3/fulltext" },
  { value: "98.1%", label: "Share of killings by police from 2013–2024 in which officers were not charged with a crime.", source: "Mapping Police Violence", sourceUrl: "https://mappingpoliceviolence.org/" },
  { value: "~50M", label: "U.S. residents who have face-to-face contact with police each year — roughly 1 in 5 adults.", source: "Bureau of Justice Statistics", sourceUrl: "https://bjs.ojp.gov/library/publications/contacts-between-police-and-public-2020" },
  { value: "20M+", label: "Traffic stops conducted by U.S. police annually — the most common police encounter.", source: "Stanford Open Policing Project", sourceUrl: "https://openpolicing.stanford.edu/" },
];

const incarcerationStats: Stat[] = [
  { value: "1.9M", label: "People currently locked up in U.S. prisons, jails, and detention centers.", source: "Prison Policy Initiative (2024)", sourceUrl: "https://www.prisonpolicy.org/reports/pie2024.html" },
  { value: "#1", label: "The United States incarcerates more people per capita than any other nation on Earth.", source: "World Prison Brief", sourceUrl: "https://www.prisonstudies.org/highest-to-lowest/prison_population_rate" },
  { value: "664 / 100k", label: "U.S. incarceration rate — roughly 5–10× higher than other developed democracies.", source: "World Prison Brief", sourceUrl: "https://www.prisonstudies.org/highest-to-lowest/prison_population_rate" },
  { value: "10.3M", label: "Jail admissions every year in the United States — most for low-level, non-violent offenses.", source: "Prison Policy Initiative", sourceUrl: "https://www.prisonpolicy.org/reports/pie2024.html" },
  { value: "5×", label: "Black Americans are imprisoned at roughly 5× the rate of white Americans.", source: "The Sentencing Project", sourceUrl: "https://www.sentencingproject.org/reports/the-color-of-justice-racial-and-ethnic-disparity-in-state-prisons/" },
  { value: "~95%", label: "Share of criminal convictions in the U.S. that are obtained through plea bargains, often without trial.", source: "National Association of Criminal Defense Lawyers", sourceUrl: "https://www.nacdl.org/Content/TheTrialPenalty" },
  { value: "~70M", label: "Americans with a criminal record — limiting access to jobs, housing, and voting.", source: "The Sentencing Project", sourceUrl: "https://www.sentencingproject.org/" },
  { value: "$182B", label: "Estimated annual cost of mass incarceration in the United States.", source: "Prison Policy Initiative", sourceUrl: "https://www.prisonpolicy.org/reports/money.html" },
];

const civilStats: Stat[] = [
  { value: "92%", label: "Share of low-income Americans who receive inadequate or no legal help for their civil legal problems.", source: "Legal Services Corporation — Justice Gap Report (2022)", sourceUrl: "https://justicegap.lsc.gov/" },
  { value: "3.6M", label: "Eviction cases filed in U.S. courts every year — the vast majority of tenants appear without a lawyer.", source: "Eviction Lab, Princeton University", sourceUrl: "https://evictionlab.org/" },
  { value: "76%", label: "Share of state civil cases in which at least one party has no legal representation.", source: "National Center for State Courts", sourceUrl: "https://www.ncsc.org/" },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Resources</span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">Why Justice Shield Matters</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-titanium-400">
          The data on policing and incarceration in the United States makes the case
          for on-demand legal protection. Below are the numbers that drive our mission.
        </p>

        <section id="statistics" className="mt-20 space-y-20">
          <header>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">01 / Statistics</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">U.S. Police Violence &amp; Incarceration Rates</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-titanium-400">
              Every figure below is sourced from public, peer-reviewed, or government datasets. Numbers reflect the most recent reporting available.
            </p>
          </header>
          <StatGroup tag="A / Police Violence" title="Encounters with law enforcement" stats={policeStats} />
          <StatGroup tag="B / Mass Incarceration" title="The world's largest prison system" stats={incarcerationStats} />
          <StatGroup tag="C / The Civil Justice Gap" title="Most Americans face the system alone" stats={civilStats} />
        </section>

        <section className="mt-24 border-t border-titanium-800 pt-12">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The numbers are the reason we exist.</h2>
          <p className="mt-4 max-w-2xl text-titanium-400">
            Justice Shield puts a vetted attorney on your screen the moment you need one —
            before a stop becomes a charge, before a charge becomes a conviction.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatGroup({ tag, title, stats }: { tag: string; title: string; stats: Stat[] }) {
  return (
    <div>
      <div className="flex items-end justify-between border-b border-titanium-800 pb-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{tag}</span>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
        </div>
      </div>
      <div className="mt-8 grid gap-px bg-titanium-800 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-titanium-950 p-6">
            <div className="font-display text-4xl font-bold tabular-nums text-action">{s.value}</div>
            <p className="mt-3 text-sm leading-relaxed text-titanium-300">{s.label}</p>
            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-action">
              Source: {s.source} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
