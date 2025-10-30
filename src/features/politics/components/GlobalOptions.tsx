import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useGetAllianceQuery, useUpdateAllianceGlobalOptionsMutation } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { Settings, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface GlobalOptionsProps {
  allianceId: number
}

const globalOptionsSchema = z.object({
  open_membership: z.boolean(),
  mission_statement: z.string().max(2000, 'Mission statement must be less than 2000 characters').optional(),
  homepage_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  motd: z.string().max(500, 'MOTD must be less than 500 characters').optional(),
})

type GlobalOptionsFormData = z.infer<typeof globalOptionsSchema>

export function GlobalOptions({ allianceId }: GlobalOptionsProps) {
  const permissions = useAlliancePermissions(allianceId)
  const { data: allianceData, isLoading } = useGetAllianceQuery(allianceId)
  const [updateOptions, { isLoading: isSaving }] = useUpdateAllianceGlobalOptionsMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<GlobalOptionsFormData>({
    resolver: zodResolver(globalOptionsSchema),
    defaultValues: {
      open_membership: allianceData?.alliance?.open_membership ?? true,
      mission_statement: allianceData?.alliance?.mission_statement || '',
      homepage_url: allianceData?.alliance?.homepage_url || '',
      motd: allianceData?.alliance?.motd || '',
    }
  })

  const openMembership = watch('open_membership')

  // Reset form when alliance data loads
  useEffect(() => {
    if (allianceData?.alliance && !isLoading) {
      reset({
        open_membership: allianceData.alliance.open_membership ?? true,
        mission_statement: allianceData.alliance.mission_statement || '',
        homepage_url: allianceData.alliance.homepage_url || '',
        motd: allianceData.alliance.motd || '',
      }, { keepDefaultValues: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allianceData?.alliance?.id, allianceData?.alliance?.open_membership, allianceData?.alliance?.mission_statement, allianceData?.alliance?.homepage_url, allianceData?.alliance?.motd, isLoading])

  if (isLoading || permissions.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!permissions.canEditGlobalOptions && !permissions.isLeader) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            You don't have permission to edit global options
          </p>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (data: GlobalOptionsFormData) => {
    try {
      await updateOptions({
        allianceId,
        data: {
          open_membership: data.open_membership,
          mission_statement: data.mission_statement || '',
          homepage_url: data.homepage_url || null,
          motd: data.motd || null,
        }
      }).unwrap()
      toast.success('Global options updated successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update global options')
    }
  }

  return (
    <Card className="panel-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Global Options
        </CardTitle>
        <CardDescription>
          Configure alliance-wide settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Open/Close Membership */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="open_membership">Open Membership</Label>
              <p className="text-sm text-muted-foreground">
                Allow players to submit join requests
              </p>
            </div>
            <Switch
              id="open_membership"
              {...register('open_membership')}
            />
          </div>

          {/* Mission Statement */}
          <div className="space-y-2">
            <Label htmlFor="mission_statement">Mission Statement</Label>
            <Textarea
              id="mission_statement"
              placeholder="Describe your alliance's goals, values, and recruitment status..."
              rows={6}
              {...register('mission_statement')}
              className={errors.mission_statement ? 'border-destructive' : ''}
            />
            {errors.mission_statement && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.mission_statement.message}
              </div>
            )}
          </div>

          {/* Homepage URL */}
          <div className="space-y-2">
            <Label htmlFor="homepage_url">Homepage URL</Label>
            <Input
              id="homepage_url"
              type="url"
              placeholder="https://example.com"
              {...register('homepage_url')}
              className={errors.homepage_url ? 'border-destructive' : ''}
            />
            {errors.homepage_url && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.homepage_url.message}
              </div>
            )}
          </div>

          {/* MOTD */}
          <div className="space-y-2">
            <Label htmlFor="motd">Message of the Day (MOTD)</Label>
            <Textarea
              id="motd"
              placeholder="Daily message shown to members when they log in..."
              rows={3}
              {...register('motd')}
              className={errors.motd ? 'border-destructive' : ''}
            />
            {errors.motd && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors.motd.message}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

