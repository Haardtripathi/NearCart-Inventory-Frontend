import { Link } from 'react-router-dom'

import { Button } from '@/components/ui'
import { EmptyState } from '@/components/common'

export function AccessDeniedPage() {
  return (
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
  )
}
