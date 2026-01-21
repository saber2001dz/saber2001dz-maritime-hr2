import * as React from "react"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';

// Define textarea size variants matching Input component
const textareaVariants = cva(
  `
    flex w-full bg-background border border-input transition-[color,box-shadow] text-foreground placeholder:text-muted-foreground/80
    focus-visible:outline-none focus-visible:ring-0 focus-visible:border-input
    disabled:cursor-not-allowed disabled:opacity-60
    [&[readonly]]:bg-muted/80 [&[readonly]]:cursor-not-allowed
    aria-invalid:border-destructive/60 aria-invalid:ring-destructive/10 dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/20
    resize-none field-sizing-content
  `,
  {
    variants: {
      variant: {
        lg: 'min-h-10 px-4 py-2 text-sm rounded-md',
        md: 'min-h-8.5 px-3 py-2 text-[0.8125rem] leading-(--text-sm--line-height) rounded-md',
        sm: 'min-h-7 px-2.5 py-1.5 text-xs rounded-md',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

function Textarea({
  className,
  variant,
  onBlur,
  onChange,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Si la valeur ne contient que des espaces ou des sauts de ligne, vider le champ
    if (e.target.value && e.target.value.trim() === '') {
      e.target.value = ''
      // Déclencher l'événement onChange pour mettre à jour l'état parent si nécessaire
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: '' },
          currentTarget: { ...e.currentTarget, value: '' },
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(syntheticEvent)
      }
    }
    // Appeler le onBlur original si fourni
    if (onBlur) {
      onBlur(e)
    }
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      onBlur={handleBlur}
      onChange={onChange}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
