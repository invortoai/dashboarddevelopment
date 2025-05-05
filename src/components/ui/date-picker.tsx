
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
import { type DateRange } from "react-day-picker"

interface DatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  mode?: "single" | "multiple" | "range" | "default"
  className?: string
}

export function DatePicker({ selected, onSelect, mode = "single", className }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selected)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  const handleSelect = React.useCallback(
    (value: Date | DateRange | undefined) => {
      if (mode === "range") {
        const range = value as DateRange
        setDateRange(range)
        // For range mode, we typically want the end date as the selected date
        // or the start date if end date is not yet selected
        if (onSelect && range?.from) {
          onSelect(range.to || range.from)
        }
      } else {
        const singleDate = value as Date
        setDate(singleDate)
        if (onSelect) {
          onSelect(singleDate)
        }
      }
    },
    [mode, onSelect]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {mode === "range" && dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} -{" "}
                {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : date ? (
            format(date, "PPP")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0 pointer-events-auto", className)} align="start">
        <Calendar
          mode={mode}
          selected={mode === "range" ? dateRange : date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
