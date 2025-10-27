"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  optionClassName?: string
  emptyMessage?: string
  id?: string
  name?: string
  required?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionnez une option",
  searchPlaceholder = "Rechercher...",
  className,
  triggerClassName,
  contentClassName,
  optionClassName,
  emptyMessage = "Aucun résultat trouvé",
  id,
  name,
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter(option =>
      option.toLowerCase().startsWith(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Reset highlighted index when filtered options change
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  // Auto-focus search input when dropdown opens and calculate position
  React.useEffect(() => {
    if (open && searchInputRef.current && triggerRef.current) {
      searchInputRef.current.focus()
      
      // Calculate dropdown position
      const rect = triggerRef.current.getBoundingClientRect()
      
      // Check if we're inside a modal/dialog (has fixed positioning)
      let parent = triggerRef.current.parentElement
      let isInModal = false
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        if (style.position === 'fixed') {
          isInModal = true
          break
        }
        parent = parent.parentElement
      }
      
      setDropdownPosition({
        top: isInModal ? rect.bottom : rect.bottom + window.scrollY,
        left: isInModal ? rect.left : rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [open])

  // Scroll highlighted option into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [highlightedIndex])

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue)
    setOpen(false)
    setSearchValue("")
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setSearchValue("")
        setHighlightedIndex(-1)
        break
    }
  }

  const selectedOption = options.find(option => option === value)

  return (
    <div className={cn("relative", className)} onKeyDown={handleKeyDown}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ""}
        required={required}
      />
      
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full !h-[42px] px-3 py-2 text-[16px] border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[rgb(7,103,132)] flex items-center justify-between",
          triggerClassName
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn(
          "truncate text-left",
          !selectedOption && "text-gray-500"
        )}>
          {selectedOption || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          open && "transform rotate-180"
        )} />
      </button>

      {/* Dropdown Content - Rendered in Portal */}
      {open && typeof window !== 'undefined' && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[55]"
            onClick={() => {
              setOpen(false)
              setSearchValue("")
              setHighlightedIndex(-1)
            }}
          />
          
          {/* Content */}
          <div 
            className={cn(
              "fixed z-[60] mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-hidden",
              contentClassName
            )}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-[rgb(7,103,132)]"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    ref={(el) => {
                      optionRefs.current[index] = el
                    }}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs cursor-pointer text-gray-700 flex items-center justify-between transition-colors",
                      "hover:bg-[rgb(236,243,245)] hover:text-[rgb(14,102,129)]",
                      value === option && "bg-[rgb(236,243,245)] text-[rgb(14,102,129)]",
                      highlightedIndex === index && "bg-[rgb(226,233,235)] text-[rgb(14,102,129)]",
                      optionClassName
                    )}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="truncate">{option}</span>
                    {value === option && (
                      <Check className="h-4 w-4 text-[rgb(14,102,129)]" />
                    )}
                  </button>
                ))
              ) : (
                <div className={cn("px-3 py-2 text-sm text-gray-500 text-center", optionClassName)}>
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}