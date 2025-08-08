import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

interface Column<T> {
  key: keyof T
  label: string
  className?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  mobileLabel?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  variant?: "table" | "cards" | "adaptive"
  emptyMessage?: string
  loading?: boolean
  rowKey?: keyof T | ((row: T, index: number) => string)
}

function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  variant = "adaptive",
  emptyMessage = "No data available",
  loading = false,
  rowKey = ((_, index) => index.toString())
}: ResponsiveTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(row, index)
    }
    return String(row[rowKey])
  }

  const visibleColumns = columns.filter(col => !col.hideOnMobile)
  const mobileColumns = columns.filter(col => !col.hideOnMobile)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  // Desktop Table View
  const TableView = () => (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={cn(
                    "p-4 align-middle [&:has([role=checkbox])]:pr-0",
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Mobile Card View
  const CardView = () => (
    <div className="space-y-3">
      {data.map((row, index) => (
        <Card key={getRowKey(row, index)} className="p-0">
          <CardContent className="p-4 space-y-2">
            {mobileColumns.map((column) => (
              <div key={String(column.key)} className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                  {column.mobileLabel || column.label}:
                </span>
                <span className="text-sm ml-2 min-w-0 flex-1 text-right">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")
                  }
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render based on variant
  if (variant === "table") {
    return <TableView />
  }

  if (variant === "cards") {
    return <CardView />
  }

  // Adaptive: Cards on mobile, table on desktop
  return (
    <>
      <div className="block md:hidden">
        <CardView />
      </div>
      <div className="hidden md:block">
        <TableView />
      </div>
    </>
  )
}

// Stack view for complex tables that need to show all data on mobile
interface StackedTableProps<T> extends ResponsiveTableProps<T> {
  primaryColumn: keyof T
}

function StackedTable<T extends Record<string, any>>({
  data,
  columns,
  primaryColumn,
  className,
  emptyMessage = "No data available",
  loading = false,
  rowKey = ((_, index) => index.toString())
}: StackedTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(row, index)
    }
    return String(row[rowKey])
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Stacked View */}
      <div className="block md:hidden space-y-4">
        {data.map((row, index) => {
          const primaryColumn_obj = columns.find(col => col.key === primaryColumn)
          const otherColumns = columns.filter(col => col.key !== primaryColumn && !col.hideOnMobile)
          
          return (
            <Card key={getRowKey(row, index)} className="p-0">
              <CardContent className="p-4">
                {/* Primary info prominently displayed */}
                <div className="mb-3">
                  <h4 className="font-semibold text-base">
                    {primaryColumn_obj?.render
                      ? primaryColumn_obj.render(row[primaryColumn], row)
                      : String(row[primaryColumn] || "")
                    }
                  </h4>
                </div>
                
                {/* Other columns in a grid */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                  {otherColumns.map((column) => (
                    <div key={String(column.key)}>
                      <span className="text-muted-foreground block">
                        {column.mobileLabel || column.label}
                      </span>
                      <span className="font-medium">
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || "")
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-auto">
          <table className={cn("w-full caption-bottom text-sm", className)}>
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "p-4 align-middle",
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || "")
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export { ResponsiveTable, StackedTable, type Column, type ResponsiveTableProps, type StackedTableProps }