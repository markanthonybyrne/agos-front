import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  iconPosition?: "left" | "right"
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, iconPosition = "left", ...props }, ref) => {
    return (
      <div className="relative">
        {iconPosition === "left" && (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        <Input
          ref={ref}
          className={cn(
            iconPosition === "left" && "pl-9",
            iconPosition === "right" && "pr-9",
            className
          )}
          {...props}
        />
        {iconPosition === "right" && (
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }

