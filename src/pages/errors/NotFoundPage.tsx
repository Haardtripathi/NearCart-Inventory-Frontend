import { Link } from 'react-router-dom'

import { Button } from '@/components/ui'
import { BreadcrumbTrail, EmptyState } from '@/components/common'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <BreadcrumbTrail items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Page not found' }]} />
        <div className="flex min-h-[70vh] items-center justify-center">
          <EmptyState
            title="Page not found"
            description="The route you requested does not exist in the inventory console."
            action={
              <Button asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}
