import * as React from 'react';

import { cn } from '@/lib/utils';
import { Eye, EyeOff, LucideProps } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  iconProps?: LucideProps;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    if (type === 'password') {
      return (
        <div className='w-full relative'>
          <input
            autoComplete='off'
            type={!show ? type : 'text'}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              className,
            )}
            ref={ref}
            {...props}
          />
          <button
            onClick={() => setShow((prev) => !prev)}
            className='absolute right-3 top-1/2 transform -translate-y-1/2'
            type='button'>
            {show ? (
              <Eye className='stroke-slate-700/70' size={18} />
            ) : (
              <EyeOff className='stroke-slate-700/70' size={18} />
            )}
          </button>
        </div>
      );
    }
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
