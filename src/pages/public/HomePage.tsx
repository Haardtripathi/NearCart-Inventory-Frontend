import { useEffect, type ElementType } from 'react'
import {
  ArrowRight,
  BellRing,
  Boxes,
  FileSpreadsheet,
  Hammer,
  Layers3,
  Package2,
  PackagePlus,
  Pill,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Warehouse,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

const featureCards = [
  {
    icon: PackagePlus,
    title: 'Easy product management',
    description: 'Add products, update details, and keep daily stock work simple for your team.',
  },
  {
    icon: Boxes,
    title: 'Track stock in one place',
    description: 'See available quantity clearly instead of checking notebooks, messages, and sheets.',
  },
  {
    icon: BellRing,
    title: 'Low stock alerts',
    description: 'Spot items that need attention before they run out on the shelf.',
  },
  {
    icon: Layers3,
    title: 'Manage variants with less confusion',
    description: 'Handle size, unit, pack, or flavor without mixing up similar products.',
  },
  {
    icon: Tags,
    title: 'Organize by category and brand',
    description: 'Keep grocery, medical, personal care, and other lines neatly grouped.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Faster than notes and Excel',
    description: 'Make quick updates during the day without messy formulas or scattered registers.',
  },
] as const

const businessTypes = [
  {
    icon: Store,
    title: 'Grocery / kirana',
    description: 'Track daily fast-moving items, packs, and shelf refills with less guesswork.',
  },
  {
    icon: Pill,
    title: 'Pharmacy / medical',
    description: 'Keep medicine and healthcare items organized so low stock is easier to spot.',
  },
  {
    icon: Sparkles,
    title: 'Stationery',
    description: 'Manage notebooks, pens, art supplies, and school-season stock in one list.',
  },
  {
    icon: Hammer,
    title: 'Hardware',
    description: 'Handle units, sizes, and product variants without turning the counter chaotic.',
  },
  {
    icon: ShieldCheck,
    title: 'Cosmetics / personal care',
    description: 'Group brands, variants, and pack sizes cleanly for quick daily updates.',
  },
  {
    icon: Warehouse,
    title: 'Small wholesale shops',
    description: 'Keep a clearer view of bulk stock and items moving in and out through the day.',
  },
] as const

const steps = [
  {
    number: '01',
    title: 'Add your products',
    description: 'Create your catalog with product names, variants, brand, and category details.',
  },
  {
    number: '02',
    title: 'Update stock during the day',
    description: 'Adjust quantities when items come in, sell out, or move between shelves and storage.',
  },
  {
    number: '03',
    title: 'See what needs attention',
    description: 'Check available stock, spot low items quickly, and stay more in control every day.',
  },
] as const

const comparisonRows = [
  {
    problem: 'Registers and manual notes',
    solution: 'Everything stays in one clean place your team can update daily.',
  },
  {
    problem: 'Excel confusion and messy sheets',
    solution: 'Simple product and stock updates without hunting through columns.',
  },
  {
    problem: 'Missed low stock items',
    solution: 'Clear low stock badges and alerts make restocking easier to catch.',
  },
  {
    problem: 'Unclear variants and similar products',
    solution: 'Keep pack size, unit, flavor, and brand details neatly organized.',
  },
] as const

const sampleProducts = [
  {
    name: 'Aashirvaad Atta 5 kg',
    meta: 'Grocery • ITC',
    quantity: '18 bags',
    status: 'In stock',
    tone: 'success' as const,
  },
  {
    name: 'Parle-G Family Pack',
    meta: 'Biscuits • Parle',
    quantity: '6 boxes',
    status: 'Low stock',
    tone: 'warning' as const,
  },
  {
    name: 'Dettol Soap 4 Pack',
    meta: 'Personal care • Reckitt',
    quantity: '12 packs',
    status: 'In stock',
    tone: 'success' as const,
  },
  {
    name: 'Crocin 650 Tablet',
    meta: 'Medical • Haleon',
    quantity: 'Out of stock',
    status: 'Needs restock',
    tone: 'danger' as const,
  },
] as const

const statusClasses = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string
  title: string
  description: string
  centered?: boolean
}) {
  return (
    <div className={cn('max-w-2xl space-y-3', centered && 'mx-auto text-center')}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">{title}</h2>
        <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType
  title: string
  description: string
}) {
  return (
    <Card className="h-full rounded-[1.5rem] border-white/80 bg-white/90 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
      <div className="flex h-full flex-col">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </Card>
  )
}

function BusinessCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <Card className="relative rounded-[1.7rem] border-white/70 bg-white/90 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <div className="space-y-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-sm shadow-emerald-200">
          {number}
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </Card>
  )
}

function MockProductRow({
  name,
  meta,
  quantity,
  status,
  tone,
}: (typeof sampleProducts)[number]) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 sm:text-[0.95rem]">{name}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{meta}</p>
        </div>
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ring-inset', statusClasses[tone])}>
          {status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Quantity
        </div>
        <p className="text-sm font-semibold text-slate-800">{quantity}</p>
      </div>
    </div>
  )
}

function FooterLink({
  label,
  href,
  to,
  onClick,
}: {
  label: string
  href?: string
  to?: string
  onClick?: () => void
}) {
  const className = 'text-sm text-slate-500 transition hover:text-slate-900'

  if (to) {
    return (
      <Link className={className} to={to} onClick={onClick}>
        {label}
      </Link>
    )
  }

  return (
    <a className={className} href={href} onClick={onClick}>
      {label}
    </a>
  )
}

export function HomePage() {
  useEffect(() => {
    document.title = 'NearCart Inventory | Inventory management for local shops'

    let descriptionMeta = document.querySelector('meta[name="description"]')
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }

    descriptionMeta.setAttribute(
      'content',
      'NearCart Inventory helps local shops track stock, manage products and variants, and stay on top of low stock with a simple daily workflow.',
    )
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eefbf2_0%,#f8fafc_48%,#f3f6fb_100%)] text-slate-900">
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_36%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-22">
            <div className="relative">
              <div className="inline-flex rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                NearCart Inventory
              </div>
              <h1 className="mt-5 max-w-2xl text-[2.4rem] font-semibold tracking-tight text-slate-900 sm:text-[3.2rem] lg:text-[3.7rem]">
                Inventory management for local shops, made simple
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Track stock, manage products and variants, and catch low stock early in one simple place your team can use every day.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full px-6 text-base">
                  <Link to="/register">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild className="h-12 rounded-full px-6 text-base" variant="outline">
                  <a href="#demo">See Demo</a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {['Stock tracking', 'Low stock alerts', 'Brands and categories', 'Daily use on mobile'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/88 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-[1.6rem] border border-white/80 bg-white/85 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.06)] sm:max-w-xl">
                <p className="text-sm font-semibold text-slate-900">Built for real shop work</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Useful for kirana stores, pharmacies, stationery shops, hardware shops, personal care stores, and small wholesalers.
                </p>
              </div>
            </div>

            <div className="relative" id="demo">
              <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,252,0.96))] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.12)] sm:p-6">
                <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/90 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Sample inventory view
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">Simple product and stock list</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                        Main shop
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
                      >
                        <PackagePlus className="h-4 w-4" />
                        Add product
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Grocery', 'Medical', 'Personal care', 'Hardware'].map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {sampleProducts.map((product) => (
                      <MockProductRow key={product.name} {...product} />
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-amber-100 bg-amber-50/80 p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-700">Low stock reminder</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">Parle-G Family Pack</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Keep daily sellers visible so restocking does not get missed.</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-slate-200 bg-white p-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Organized details</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">Variants, brand, and category</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Keep similar items easier to search and update during busy hours.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8 lg:py-18" id="features">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Features"
              title="Everything a small shop needs for daily inventory work"
              description="NearCart Inventory stays focused on the basics that matter most: products, stock quantity, variants, low stock visibility, and cleaner everyday updates."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 bg-white/55 px-4 py-12 sm:px-6 lg:px-8 lg:py-18" id="who-its-for">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Who It’s For"
              title="Made for local businesses with real shelves, counters, and daily stock movement"
              description="Whether you sell groceries, medicines, stationery, hardware, or personal care items, the goal is the same: know what you have, what is running low, and what needs updating."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {businessTypes.map((business) => (
                <BusinessCard key={business.title} {...business} />
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8 lg:py-18" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="How It Works"
              title="Simple enough to understand in minutes"
              description="You do not need a long setup or training-heavy workflow. Start with products, keep stock updated, and use clear visibility to stay on top of daily operations."
            />

            <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
              <div aria-hidden="true" className="absolute left-[17%] right-[17%] top-10 hidden h-px bg-slate-200 lg:block" />
              {steps.map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 bg-white/55 px-4 py-12 sm:px-6 lg:px-8 lg:py-18" id="why-nearcart">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Why NearCart Inventory"
              title="Better than registers, loose notes, and confusing sheets"
              description="This is about making daily stock work easier to follow, easier to update, and less likely to slip during a busy shop day."
            />

            <Card className="mt-8 overflow-hidden rounded-[1.8rem] border-white/80 bg-white/92 shadow-[0_24px_65px_rgba(15,23,42,0.08)]">
              <div className="grid gap-0">
                {comparisonRows.map((row, index) => (
                  <div
                    key={row.problem}
                    className={cn(
                      'grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center',
                      index < comparisonRows.length - 1 && 'border-b border-slate-200/80',
                    )}
                  >
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Common problem</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{row.problem}</p>
                    </div>
                    <div className="hidden justify-center lg:flex">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">NearCart Inventory</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{row.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8 lg:py-18" id="cta">
          <div className="mx-auto max-w-7xl">
            <Card className="overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,244,0.92),rgba(255,255,255,0.96))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-2xl space-y-3">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">Start simple</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">
                    Keep your shop inventory clearer from day one
                  </h2>
                  <p className="text-sm leading-7 text-slate-600 sm:text-base">
                    Move from notebooks and messy sheets to one practical inventory workspace your team can actually use.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button asChild className="h-12 rounded-full px-6 text-base">
                    <Link to="/register">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="h-12 rounded-full px-6 text-base" variant="outline">
                    <Link to="/login">Login</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/92 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Package2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">NearCart Inventory</p>
                <p className="text-xs text-slate-500">Simple stock management for local shops</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              A practical inventory workspace for local businesses that want cleaner stock tracking, better product organization, and fewer low stock surprises.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FooterLink label="Features" href="#features" />
            <FooterLink label="Demo" href="#demo" />
            <FooterLink label="Login" to="/login" />
            <FooterLink label="Privacy" to="/privacy" />
            <FooterLink label="Terms" to="/terms" />
            <FooterLink label="Contact" href="#cta" />
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-slate-200/80 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NearCart Inventory</p>
          <p>Built for simple daily stock work.</p>
        </div>
      </footer>
    </div>
  )
}
