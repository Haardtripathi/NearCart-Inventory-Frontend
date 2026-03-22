import { useEffect, type ReactNode } from 'react'
import { ArrowLeft, Package2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, Card } from '@/components/ui'

interface LegalSection {
  title: string
  paragraphs: string[]
}

function PublicPageLayout({
  title,
  description,
  sections,
  pageTitle,
  pageDescription,
}: {
  title: string
  description: string
  sections: LegalSection[]
  pageTitle: string
  pageDescription: string
}) {
  useEffect(() => {
    document.title = pageTitle

    let descriptionMeta = document.querySelector('meta[name="description"]')
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      document.head.appendChild(descriptionMeta)
    }

    descriptionMeta.setAttribute('content', pageDescription)
  }, [pageDescription, pageTitle])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eefbf2_0%,#f8fafc_48%,#f3f6fb_100%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[1.8rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Package2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">NearCart Inventory</p>
              <p className="text-xs text-slate-500">Public information</p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-[2rem] border-white/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="max-w-3xl space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">NearCart Inventory</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.4rem]">{title}</h1>
            <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
          </div>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600 sm:text-[0.96rem]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>

        <p className="px-1 text-sm text-slate-500">
          These pages are lightweight public placeholders so visitors have clear footer destinations from the homepage.
        </p>
      </div>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <PublicPageLayout
      title="Privacy"
      description="NearCart Inventory is built to help local businesses manage stock and product records with a practical, trustworthy workflow."
      pageTitle="Privacy | NearCart Inventory"
      pageDescription="Privacy information for the public NearCart Inventory website."
      sections={[
        {
          title: 'What this page covers',
          paragraphs: [
            'This public privacy page explains the kind of information a visitor may share when using the NearCart Inventory website, such as signing in, creating a workspace, or requesting access.',
            'It is intentionally written in simple language so local business owners can understand the basics without legal-heavy wording.',
          ],
        },
        {
          title: 'Information you may share',
          paragraphs: [
            'When you sign up or log in, you may provide details like your name, email address, organization name, and basic business information needed to create and manage your workspace.',
            'Product, stock, brand, and related inventory records entered inside the app are used to support your day-to-day inventory workflow.',
          ],
        },
        {
          title: 'How information is used',
          paragraphs: [
            'Information is used to help you access the product, manage inventory operations, and keep your workspace working as expected.',
            'NearCart Inventory should use only the information needed to support account access, product setup, stock visibility, and related operational features.',
          ],
        },
      ]}
    />
  )
}

export function TermsPage() {
  return (
    <PublicPageLayout
      title="Terms"
      description="These basic public terms explain the purpose of the NearCart Inventory website and set expectations in a straightforward way."
      pageTitle="Terms | NearCart Inventory"
      pageDescription="Terms information for the public NearCart Inventory website."
      sections={[
        {
          title: 'Using NearCart Inventory',
          paragraphs: [
            'NearCart Inventory is intended to help local shops and small businesses manage stock, products, variants, categories, brands, and related inventory flow.',
            'The public website is meant to explain the product, help visitors sign in or get started, and guide businesses toward the right next step.',
          ],
        },
        {
          title: 'Account responsibility',
          paragraphs: [
            'Users are responsible for the information they enter into their workspace and for controlling who can access their business data.',
            'Organizations should review product, stock, and user details regularly so the information stays accurate and useful for daily operations.',
          ],
        },
        {
          title: 'Service expectations',
          paragraphs: [
            'The product should aim to stay practical, simple, and reliable, but businesses should still review important inventory decisions before acting on them.',
            'These lightweight terms are placeholders for the public homepage experience and can be replaced later with full legal copy when available.',
          ],
        },
      ]}
    />
  )
}
