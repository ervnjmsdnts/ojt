import { useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { useCallback, useState } from 'react';
import { Month } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { monthNames } from '@/lib/constants';

export default function MonthlyReportDialog() {
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);

  const navigate = useNavigate();

  const onNavigate = useCallback(() => {
    if (!selectedMonth) return;

    navigate({
      to: '/reports/$day',
      params: { day: selectedMonth.toString() },
    });
  }, [selectedMonth]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Monthly Report</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Monthly Report</DialogTitle>
        </DialogHeader>

        <div>
          <Select
            value={selectedMonth !== null ? selectedMonth.toString() : ''}
            onValueChange={(value) =>
              setSelectedMonth(parseInt(value, 10) as Month)
            }>
            <SelectTrigger>
              <SelectValue placeholder='Select a month' />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className='justify-end pt-4'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
          <Button disabled={selectedMonth === null} onClick={onNavigate}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
