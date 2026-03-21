import { useEffect, useId } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

import type { TranslationInput, VariantTranslationInput } from '@/types/common'
import { APP_LANGUAGES } from '@/types/common'
import { toBackendLanguage } from '@/lib/locale'
import { Button, Checkbox, Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

export function FormField({
  label,
  error,
  description,
  required = false,
  children,
  className,
}: {
  label: string
  error?: unknown
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-800">
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
        {description ? <span className="text-xs leading-5 text-slate-500">{description}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{typeof error === 'string' ? error : 'This field is invalid'}</span> : null}
    </label>
  )
}

export function CheckboxField({
  label,
  description,
  checked,
  onCheckedChange,
  className,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-left transition hover:border-emerald-200',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5"
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="block text-xs leading-5 text-slate-500">{description}</span> : null}
      </span>
    </label>
  )
}

export function TranslationFields({
  value,
  onChange,
  withDescription = true,
}: {
  value?: TranslationInput[] | VariantTranslationInput[]
  onChange: (value: TranslationInput[] | VariantTranslationInput[]) => void
  withDescription?: boolean
}) {
  const { t } = useTranslation(['common', 'products'])
  const safeValue = value ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {APP_LANGUAGES.map((language) => {
        const backendLanguage = toBackendLanguage(language)
        const current = safeValue.find((item) => item.language === backendLanguage)

        return (
          <div key={language} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{backendLanguage}</p>
            <div className="space-y-3">
              <Input
                placeholder={`${t('name')} (${backendLanguage})`}
                value={current?.name ?? ''}
                onChange={(event) => {
                  const nextValue = [...safeValue]
                  const index = nextValue.findIndex((item) => item.language === backendLanguage)
                  const updated = {
                    ...(current ?? { language: backendLanguage }),
                    name: event.target.value,
                  }

                  if (index >= 0) {
                    nextValue[index] = updated
                  } else {
                    nextValue.push(updated)
                  }

                  onChange(nextValue)
                }}
              />
              {withDescription ? (
                <Textarea
                  placeholder={`${t('descriptionLabel', { ns: 'common' })} (${backendLanguage})`}
                  value={(current as TranslationInput | undefined)?.description ?? ''}
                  onChange={(event) => {
                    const nextValue = [...safeValue]
                    const index = nextValue.findIndex((item) => item.language === backendLanguage)
                    const updated = {
                      ...(current ?? { language: backendLanguage }),
                      description: event.target.value,
                    }

                    if (index >= 0) {
                      nextValue[index] = updated as TranslationInput
                    } else {
                      nextValue.push(updated as TranslationInput)
                    }

                    onChange(nextValue)
                  }}
                />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function KeyValueEditor({
  value,
  onChange,
}: {
  value?: Record<string, string>
  onChange: (value: Record<string, string>) => void
}) {
  const { t } = useTranslation('common')
  const pairs = Object.entries(value ?? {})

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-4">
      {pairs.length === 0 ? <p className="text-sm text-slate-500">{t('noAttributes')}</p> : null}
      {pairs.map(([key, currentValue], index) => (
        <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            value={key}
            onChange={(event) => {
              const next = [...pairs]
              next[index] = [event.target.value, currentValue]
              onChange(Object.fromEntries(next.filter(([nextKey]) => nextKey.trim())))
            }}
            placeholder={t('attribute')}
          />
          <Input
            value={currentValue}
            onChange={(event) => {
              const next = [...pairs]
              next[index] = [key, event.target.value]
              onChange(Object.fromEntries(next.filter(([nextKey]) => nextKey.trim())))
            }}
            placeholder={t('value')}
          />
          <Button
            className="justify-center"
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              const next = pairs.filter((_, pairIndex) => pairIndex !== index)
              onChange(Object.fromEntries(next))
            }}
          >
            {t('remove')}
          </Button>
        </div>
      ))}
      <Button
        className="border-dashed"
        size="sm"
        variant="outline"
        type="button"
        onClick={() => {
          onChange({
            ...(value ?? {}),
            [`attribute_${pairs.length + 1}`]: '',
          })
        }}
      >
        {t('addAttribute')}
      </Button>
    </div>
  )
}

export function DirtyStatePrompt({ active }: { active: boolean }) {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!active) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [active])

  return null
}

// ---- Controlled form helpers (react-hook-form + shadcn) ----

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const ADD_ACTION_VALUE = '__ADD_ACTION__'
const EMPTY_OPTION_VALUE = '__EMPTY_OPTION__'

export function ControlledSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  options,
  placeholder = 'Select…',
  disabled,
  className,
  addActionLabel,
  onAddAction,
  emptyOptionLabel,
}: {
  control: Control<TFieldValues>
  name: TName
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  addActionLabel?: string
  onAddAction?: () => void
  emptyOptionLabel?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value || (emptyOptionLabel ? EMPTY_OPTION_VALUE : undefined)}
          onValueChange={(value) => {
            if (value === ADD_ACTION_VALUE) {
              onAddAction?.()
              return
            }

            if (value === EMPTY_OPTION_VALUE) {
              field.onChange('')
              return
            }

            field.onChange(value)
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn('w-full', className)} ref={field.ref}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {emptyOptionLabel ? <SelectItem value={EMPTY_OPTION_VALUE}>{emptyOptionLabel}</SelectItem> : null}
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
            {addActionLabel ? (
              <>
                <SelectItem value={ADD_ACTION_VALUE}>
                  <span className="inline-flex items-center gap-2 font-medium text-primary">
                    <Plus className="h-4 w-4" />
                    {addActionLabel}
                  </span>
                </SelectItem>
              </>
            ) : null}
          </SelectContent>
        </Select>
      )}
    />
  )
}

export function ControlledDatePicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  placeholder,
  disabled,
  fromDate,
  toDate,
  className,
}: {
  control: Control<TFieldValues>
  name: TName
  placeholder?: string
  disabled?: boolean
  fromDate?: Date
  toDate?: Date
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = field.value as any
        const dateValue = raw ? (raw instanceof Date ? raw : new Date(raw as string)) : null
        return (
          <DatePicker
            value={dateValue}
            onChange={(date) => field.onChange(date?.toISOString() ?? null)}
            placeholder={placeholder}
            disabled={disabled}
            fromDate={fromDate}
            toDate={toDate}
            className={className}
          />
        )
      }}
    />
  )
}
