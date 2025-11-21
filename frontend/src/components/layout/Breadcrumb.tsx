import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  isCurrent?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={cn(
                'text-gray-600 hover:text-blue-600 transition-colors',
                item.isCurrent && 'text-blue-600 font-medium'
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn('text-gray-500', item.isCurrent && 'text-gray-900 font-medium')}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

export type { BreadcrumbItem as BreadcrumbItemType }