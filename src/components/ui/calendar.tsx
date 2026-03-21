import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rounded-[22px] bg-white p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-semibold text-slate-900',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
        ),
        button_next: cn(
          'absolute right-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-10 rounded-md text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400',
        week: 'flex w-full mt-2',
        day: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
          '[&:has([aria-selected])]:bg-emerald-50 first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl',
        ),
        day_button: 'inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 aria-selected:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-50',
        range_start: 'range-start',
        range_end: 'range-end',
        selected: 'bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white rounded-xl',
        today: 'border border-emerald-200 bg-emerald-50 text-emerald-900 font-semibold',
        outside: 'text-slate-300 opacity-70',
        disabled: 'cursor-not-allowed text-slate-300 opacity-50',
        range_middle: 'aria-selected:bg-emerald-50 aria-selected:text-slate-900 rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
