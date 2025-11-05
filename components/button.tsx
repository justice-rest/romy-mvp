import { ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface ButtonProps {
  href?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
  target?: string;
}

export default function Button({ onClick, href, children, className = '', icon, iconPosition = 'left', size = 'medium', disabled = false, target = '' }: ButtonProps) {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs rounded-md',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <Link
      href={href ?? ''}
      target={target ?? '_blank'}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className={cn(iconPosition === 'left' ? 'mr-2 order-first' : 'ml-2 order-last')}>{icon}</span>}
      {children}
    </Link>
  );
}

