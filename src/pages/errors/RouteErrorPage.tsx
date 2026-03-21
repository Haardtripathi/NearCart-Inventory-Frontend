import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { EmptyState } from '@/components/common'
import { Button } from '@/components/ui'

export function RouteErrorPage() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Page failed to load'

  const description = isRouteErrorResponse(error)
    ? error.data?.message ?? 'The requested page could not be rendered.'
    : error instanceof Error
      ? error.message
      : 'Something prevented this screen from rendering correctly.'

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
