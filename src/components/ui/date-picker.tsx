
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected)

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (onSelect) {
      onSelect(newDate)
    }
  }

  return (
    <div className="grid gap-2">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        initialFocus
      />
    </div>
  )
}
