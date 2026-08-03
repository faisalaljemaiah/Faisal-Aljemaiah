import * as React from 'react'
import { AlertTriangle, MapPinned, Search, Snowflake, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDrugSearch } from '@/hooks/useDrugs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { MEDICATION_CATEGORIES, categoryLabel } from '@/lib/constants'
import type { MedicationCategory } from '@/types/database'

export default function DrugLocatorPage() {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<MedicationCategory | 'all'>('all')
  const debounced = useDebouncedValue(search, 200)
  const { data: drugs, isLoading } = useDrugSearch(debounced, category)

  return (
    <div>
      <PageHeader title="Drug Locator" description="Find where medications are stored — fast." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by generic or brand name..."
            className="pl-9"
            autoFocus
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as MedicationCategory | 'all')}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {MEDICATION_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (drugs ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <MapPinned className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No medications found</p>
            <p className="text-sm text-muted-foreground">Try a different generic or brand name.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(drugs ?? []).map((drug) => (
            <Card key={drug.id} className="overflow-hidden">
              {drug.image_urls[0] && (
                <img src={drug.image_urls[0]} alt={drug.generic_name} className="h-32 w-full object-cover" />
              )}
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold capitalize">{drug.generic_name}</p>
                    {drug.brand_names.length > 0 && (
                      <p className="text-xs text-muted-foreground">{drug.brand_names.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {drug.category && <Badge variant="outline">{categoryLabel(drug.category)}</Badge>}
                    {drug.drug_class && <Badge variant="secondary">{drug.drug_class}</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-2.5 text-sm">
                  <MapPinned className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{drug.storage_room}</p>
                    <p className="text-xs text-muted-foreground">
                      {[drug.storage_shelf && `Shelf ${drug.storage_shelf}`, drug.storage_bin && `Bin ${drug.storage_bin}`]
                        .filter(Boolean)
                        .join(' · ') || 'No shelf/bin details'}
                    </p>
                  </div>
                </div>

                {(drug.is_controlled || drug.is_refrigerated || drug.is_high_alert) && (
                  <div className="flex flex-wrap gap-1.5">
                    {drug.is_controlled && (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" /> Controlled
                      </Badge>
                    )}
                    {drug.is_refrigerated && (
                      <Badge variant="outline" className="gap-1">
                        <Snowflake className="h-3 w-3" /> Refrigerated
                      </Badge>
                    )}
                    {drug.is_high_alert && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> High alert
                      </Badge>
                    )}
                  </div>
                )}

                {drug.notes && <p className="text-xs text-muted-foreground">{drug.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
