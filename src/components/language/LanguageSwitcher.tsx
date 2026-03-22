import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LANGUAGE_LABELS } from '@/lib/locale'
import { useLocale } from '@/hooks/useLocale'
import type { AppLanguage } from '@/types/common'
import { OptionSelect } from '@/components/ui'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({
  className,
  triggerClassName,
}: {
  className?: string
  triggerClassName?: string
}) {
  const { t } = useTranslation('common')
  const { language, setLanguage } = useLocale()

  return (
    <div className={cn('flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 shadow-sm sm:min-w-[148px]', className)}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Globe2 className="h-4 w-4" />
      </span>
      <OptionSelect
        className={cn('h-8 min-w-0 border-0 bg-transparent px-0 shadow-none focus:border-transparent focus:ring-0', triggerClassName)}
        contentClassName="min-w-[148px]"
        value={language}
        onValueChange={(value) => void setLanguage(value as AppLanguage)}
        options={Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        placeholder={t('language')}
      />
    </div>
  )
}
