import { useMemo } from 'react'

export function usePagination(page: number, totalPages: number) {
  return useMemo(() => {
    const pages = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)

    for (let currentPage = start; currentPage <= end; currentPage += 1) {
      pages.push(currentPage)
    }

    return {
      pages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    }
  }, [page, totalPages])
}
