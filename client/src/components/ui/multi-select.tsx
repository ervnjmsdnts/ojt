import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Command, CommandGroup, CommandInput, CommandItem } from './command';
import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  value: Option[];
  onChange: (value: Option[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleUnselect = (option: Option) => {
    onChange(value.filter((item) => item.value !== option.value));
  };

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '' && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }
        if (e.key === 'Escape') {
          input.blur();
          setOpen(false);
        }
      }
    },
    [value, onChange],
  );

  const filteredOptions = options.filter((option) => 
    option.label.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.some((item) => item.value === option.value)
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn(
        'overflow-visible bg-transparent',
        className,
      )}>
      <div
        className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex gap-1 flex-wrap">
          {value.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className='bg-secondary text-secondary-foreground hover:bg-secondary/80'>
              {option.label}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnselect(option);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(option)}>
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => {
              setTimeout(() => setOpen(false), 200);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      {open && (
        <div className="relative mt-2">
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="max-h-[200px] overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      onChange([...value, option]);
                      setInputValue('');
                    }}
                    className={'cursor-pointer'}>
                    {option.label}
                  </CommandItem>
                ))
              ) : (
                <div className="py-2 px-4 text-sm text-muted-foreground">
                  No options found
                </div>
              )}
            </CommandGroup>
          </div>
        </div>
      )}
    </Command>
  );
} 