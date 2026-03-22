import { Menu, Package2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button, Sheet, SheetContent, SheetTrigger } from '@/components/ui'

const navigationLinks = [
  { label: 'Features', hash: '#features' },
  { label: "Who It's For", hash: '#who-its-for' },
  { label: 'How It Works', hash: '#how-it-works' },
  { label: 'Demo', hash: '#demo' },
] as const

function resolveSectionHref(pathname: string, hash: string) {
  return pathname === '/' ? hash : `/${hash}`
}

export function PublicNavbar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8" aria-label="Primary">
        <Link className="flex items-center gap-3" to="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
            <Package2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">NearCart</p>
            <p className="text-xs text-slate-500">Inventory</p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navigationLinks.map((item) => (
            <a key={item.label} className="text-sm font-medium text-slate-600 transition hover:text-slate-900" href={resolveSectionHref(pathname, item.hash)}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant={pathname === '/login' ? 'outline' : 'ghost'}>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild variant={pathname === '/register' ? 'secondary' : 'default'}>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Open navigation menu" className="lg:hidden" size="icon" variant="outline">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] max-w-[92vw] border-l border-slate-200 bg-white p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 px-5 py-5">
                <Link className="flex items-center gap-3" to="/">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Package2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">NearCart</p>
                    <p className="text-xs text-slate-500">Inventory</p>
                  </div>
                </Link>
              </div>

              <div className="flex-1 space-y-2 px-5 py-5">
                {navigationLinks.map((item) => (
                  <a
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-slate-900"
                    href={resolveSectionHref(pathname, item.hash)}
                  >
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>

              <div className="space-y-3 border-t border-slate-200 px-5 py-5">
                <Button asChild className="w-full">
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/login">Login</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
