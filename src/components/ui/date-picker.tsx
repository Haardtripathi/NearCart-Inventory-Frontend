import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/index'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  fromDate?: Date
  toDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  fromDate,
  toDate,
}: DatePickerProps) {
  const { t } = useTranslation('common')
  const resolvedPlaceholder = placeholder ?? t('pickDate')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 w-full justify-between text-left font-medium',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{value ? format(value, 'dd MMM yyyy') : resolvedPlaceholder}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-md border border-slate-200 bg-white p-2 shadow-[0_18px_38px_rgba(15,23,42,0.12)]" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={onChange}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
