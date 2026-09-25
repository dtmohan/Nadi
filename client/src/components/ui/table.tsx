import * as React from "react"

import { cn } from "@/lib/utils"

/** Copies each header's text onto the body cells (data-label) so the phone stylesheet can lay rows out as labelled cards. */
function labelCells(table: HTMLTableElement) {
  const heads = Array.from(table.querySelectorAll<HTMLTableCellElement>(":scope > thead > tr:last-child > th"))
  if (!heads.length) return
  const labels = heads.map((h) => (h.getAttribute("aria-label") ?? h.textContent ?? "").replace(/\s+/g, " ").trim())
  for (const row of Array.from(table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr"))) {
    let col = 0
    for (const cell of Array.from(row.children) as HTMLTableCellElement[]) {
      if (cell.colSpan > 1) {
        cell.removeAttribute("data-label")
      } else if (labels[col] !== undefined && cell.getAttribute("data-label") !== labels[col]) {
        cell.setAttribute("data-label", labels[col])
      }
      col += cell.colSpan || 1
    }
  }
}

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { cards?: boolean }
>(({ className, cards, ...props }, ref) => {
  const inner = React.useRef<HTMLTableElement | null>(null)
  const setRef = React.useCallback(
    (el: HTMLTableElement | null) => {
      inner.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLTableElement | null>).current = el
    },
    [ref],
  )
  React.useEffect(() => {
    const el = inner.current
    if (!cards || !el) return
    labelCells(el)
    const mo = new MutationObserver(() => labelCells(el))
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [cards])
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={setRef}
        className={cn("w-full caption-bottom text-sm", cards && "table-cards", className)}
        {...props}
      />
    </div>
  )
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted focus-visible:outline-none focus-visible:bg-muted/60 focus-visible:shadow-[inset_2px_0_0_hsl(var(--primary))]",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
