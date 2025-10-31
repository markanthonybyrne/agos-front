import { useState } from 'react'
import { useBulkAdjustResourcesMutation } from '@/api/endpoints/adminApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

const adjustmentSchema = z.object({
  adjustments: z.array(z.object({
    planet_id: z.number().min(1),
    tellerium: z.number().optional(),
    krypton: z.number().optional(),
  })).min(1, 'At least one adjustment is required'),
  reason: z.string().min(1, 'Reason is required'),
})

export function ResourceManagement() {
  const [bulkAdjust] = useBulkAdjustResourcesMutation()

  const form = useForm<z.infer<typeof adjustmentSchema>>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustments: [{ planet_id: 0 }],
      reason: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adjustments',
  })

  const handleSubmit = async (data: z.infer<typeof adjustmentSchema>) => {
    try {
      const result = await bulkAdjust(data).unwrap()
      toast.success(`Successfully adjusted ${result.adjusted} planets`)
      form.reset({
        adjustments: [{ planet_id: 0 }],
        reason: '',
      })
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to adjust resources')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Resource Management</h2>
        <p className="text-muted-foreground">Bulk adjust planet resources</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Resource Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Planet Adjustments</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ planet_id: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Planet
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Planet {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Planet ID *</Label>
                      <Input
                        type="number"
                        {...form.register(`adjustments.${index}.planet_id`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tellerium Adjustment</Label>
                      <Input
                        type="number"
                        placeholder="Leave empty for no change"
                        {...form.register(`adjustments.${index}.tellerium`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Krypton Adjustment</Label>
                      <Input
                        type="number"
                        placeholder="Leave empty for no change"
                        {...form.register(`adjustments.${index}.krypton`, { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment *</Label>
              <Textarea
                id="reason"
                {...form.register('reason')}
                placeholder="Enter reason for bulk resource adjustment..."
              />
              {form.formState.errors.reason && (
                <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Processing...' : 'Apply Adjustments'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
