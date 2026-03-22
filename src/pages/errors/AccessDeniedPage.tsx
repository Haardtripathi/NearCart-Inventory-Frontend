import { Link } from 'react-router-dom'

import { Button } from '@/components/ui'
import { BreadcrumbTrail, EmptyState } from '@/components/common'

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <BreadcrumbTrail items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Access denied' }]} />
        <div className="flex min-h-[70vh] items-center justify-center">
          <EmptyState
            title="Access denied"
            description="You do not have permission to open this section with the current organization role."
            action={
              <Button asChild>
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}
