import { Link } from 'react-router-dom'

import { Button } from '@/components/ui'
import { EmptyState } from '@/components/common'

export function NotFoundPage() {
  return (
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
  )
}
