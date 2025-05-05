
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
import { DateRange } from "react-day-picker"

interface DatePickerProps {
  selected?: Date | DateRange
  onSelect?: (date: Date | DateRange | undefined) => void
  mode?: "single" | "range" | "multiple" | "default"
}

export function DatePicker({ 
  selected, 
  onSelect, 
  mode = "single" 
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | DateRange | undefined>(selected)

  // Create a type-safe handler for all calendar modes
  const handleSelect = (newDate: Date | DateRange | undefined) => {
    setDate(newDate)
    if (onSelect) {
      onSelect(newDate)
    }
  }

  // Format the display based on the selected date type
  const getFormattedDate = () => {
    if (!date) return <span>Pick a date</span>;
    
    if (date instanceof Date) {
      return format(date, "PPP");
    } 
    
    if ('from' in date) {
      return (
        <>
          {date.from ? format(date.from, "PPP") : ""}
          {date.to ? ` - ${format(date.to, "PPP")}` : ""}
        </>
      );
    }
    
    return <span>Pick a date</span>;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getFormattedDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={date as DateRange}
            onSelect={handleSelect as (range: DateRange | undefined) => void}
            initialFocus
            className="pointer-events-auto"
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={date instanceof Date ? [date] : []}
            onSelect={(dates) => {
              // Handle the multiple dates selection
              // For simplicity, we'll just use the first date if any
              const newDate = dates && dates.length > 0 ? dates[0] : undefined;
              handleSelect(newDate);
            }}
            initialFocus
            className="pointer-events-auto"
          />
        )}
        {(mode === "single" || mode === "default") && (
          <Calendar
            mode="single"
            selected={date instanceof Date ? date : undefined}
            onSelect={handleSelect as (date: Date | undefined) => void}
            initialFocus
            className="pointer-events-auto"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
