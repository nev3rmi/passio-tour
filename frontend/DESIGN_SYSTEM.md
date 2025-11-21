# Frontend Design System - Passio Tour

## Design Principles

### Color Palette
- **Primary**: `hsl(var(--primary))` - Main brand color for CTAs and key elements
- **Secondary**: `hsl(var(--secondary))` - Supporting elements and backgrounds
- **Accent**: `hsl(var(--accent))` - Highlights and interactive states
- **Destructive**: `hsl(var(--destructive))` - Errors, deletions, warnings
- **Muted**: `hsl(var(--muted))` - Subtle backgrounds and disabled states

### Typography
- **Headings**: Use semantic hierarchy (h1 → h6)
- **Body**: Consistent font sizes using Tailwind scale
- **Colors**: Use `text-foreground` for primary text, `text-muted-foreground` for secondary

### Spacing
- Use Tailwind spacing scale (p-4, m-6, gap-8, etc.)
- Consistent container padding: `container mx-auto py-12`
- Card spacing: `p-6` for standard cards

## Component Standards

### Layout Components

#### LayoutWrapper
```tsx
// Background options: 'gradient' | 'white' | 'gray'
<LayoutWrapper background="gradient">
  {/* Your content */}
</LayoutWrapper>
```

#### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

#### Buttons
```tsx
// Variants: default | destructive | outline | secondary | ghost | link
// Sizes: default | sm | lg | icon
<Button variant="default" size="lg">
  Primary Action
</Button>

<Button variant="outline">
  Secondary Action
</Button>
```

### Grid System
- Use Tailwind grid utilities
- Responsive breakpoints: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Consistent gaps: `gap-6` or `gap-8`

### Forms
- Inputs use `Input` component from shadcn/ui
- Labels use `Label` component
- Form spacing: `space-y-4`
- Validation states use border colors

## Page Structure Template

```tsx
'use client'

import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PageName() {
  return (
    <LayoutWrapper background="white">
      <main className="container mx-auto py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Page Title</h1>
            <p className="text-muted-foreground">
              Page description goes here
            </p>
          </div>

          {/* Content Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Content */}
            </CardContent>
          </Card>
        </div>
      </main>
    </LayoutWrapper>
  )
}
```

## Common Patterns

### Loading States
```tsx
import LoadingState from '@/components/layout/LoadingState'

if (loading) return <LoadingState />
```

### Error States
```tsx
import ErrorState from '@/components/layout/ErrorState'

if (error) return <ErrorState message="Error message" />
```

### Empty States
Use Cards with centered content and descriptive messages

### Data Lists
- Use grid layout for cards
- Consistent card structure
- Hover effects: `hover:shadow-lg transition-shadow`

## Responsive Design
- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Touch-friendly buttons: min-height 44px

## Dark Mode
- System automatically supports dark mode via CSS variables
- Test in both light and dark modes
- Use theme-appropriate colors from the design system

## Best Practices
1. **Consistent Imports**: Use `@/` alias for all imports
2. **Type Safety**: Use TypeScript interfaces for all props
3. **Accessibility**: Use semantic HTML, ARIA labels
4. **Performance**: Use Next.js Image component for images
5. **Error Handling**: Always handle loading and error states
6. **Reusability**: Create small, focused components

## Component Library
- shadcn/ui components (Button, Card, Input, etc.)
- Custom layout components (LayoutWrapper, Navigation, Footer)
- Consistent styling through Tailwind CSS
- Dark mode support built-in