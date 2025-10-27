'use client';

import { DateField, DateInput } from '@/components/ui/datefield';
import { InputAddon, InputGroup, InputWrapper } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';

export default function InputDemo() {
  return (
    <div className="flex flex-col gap-5">
      <div className="w-80">
        <DateField>
          <DateInput />
        </DateField>
      </div>
      <div className="w-80">
        <InputGroup>
          <InputAddon mode="icon">
            <CalendarDays />
          </InputAddon>
          <DateField>
            <DateInput />
          </DateField>
        </InputGroup>
      </div>
      <div className="w-80">
        <InputGroup>
          <DateField>
            <DateInput />
          </DateField>
          <InputAddon mode="icon">
            <CalendarDays />
          </InputAddon>
        </InputGroup>
      </div>
      <div className="w-80">
        <InputWrapper>
          <DateField>
            <DateInput />
          </DateField>
          <CalendarDays />
        </InputWrapper>
      </div>
      <div className="w-80">
        <InputWrapper>
          <CalendarDays />
          <DateField>
            <DateInput />
          </DateField>
        </InputWrapper>
      </div>
    </div>
  );
}
