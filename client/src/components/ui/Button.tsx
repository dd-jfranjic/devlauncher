import React from 'react'
import { ButtonProps } from '@types'
import { cn } from '@lib/utils'

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'min-h-touch'
  ]

  const variantClasses = {
    primary: [
      'bg-primary text-white',
      'hover:bg-primary-dark',
      'disabled:bg-neutral-300 disabled:text-neutral-500',
      'border border-transparent'
    ],
    secondary: [
      'bg-neutral-100 text-neutral-800 border border-neutral-300',
      'hover:bg-neutral-200 hover:border-neutral-400',
      'disabled:bg-neutral-50 disabled:text-neutral-400'
    ],
    ghost: [
      'bg-transparent text-neutral-700 border border-transparent',
      'hover:bg-neutral-100 hover:text-neutral-900',
      'disabled:text-neutral-400'
    ]
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-caption rounded-button',
    md: 'h-10 px-4 text-body rounded-button',
    lg: 'h-12 px-6 text-body rounded-button'
  }

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading && 'cursor-wait',
    className
  )

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 mr-2 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button