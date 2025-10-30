import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Bell, 
  Mail, 
  Shield, 
  Ship, 
  Zap,
  Save,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} from '@/api/endpoints/authApi'

interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { data: preferencesData, isLoading: isLoadingPreferences } = useGetPreferencesQuery()
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation()

  const [settings, setSettings] = useState({
    // General Notifications
    emailNotifications: false,
    pushNotifications: true,
    
    // Game Events
    constructionCompleted: true,
    researchCompleted: true,
    fleetArrived: true,
    fleetAttacked: true,
    planetColonized: true,
    allianceMessage: false,
    empireAttacked: true,
  })

  // Load preferences from API when available
  useEffect(() => {
    if (preferencesData) {
      setSettings({
        emailNotifications: preferencesData.notifications.email_notifications ?? false,
        pushNotifications: preferencesData.notifications.push_notifications ?? true,
        constructionCompleted: preferencesData.events.construction_completed ?? true,
        researchCompleted: preferencesData.events.research_completed ?? true,
        fleetArrived: preferencesData.events.fleet_arrived ?? true,
        fleetAttacked: preferencesData.events.fleet_attacked ?? true,
        planetColonized: preferencesData.events.planet_colonized ?? true,
        allianceMessage: preferencesData.events.alliance_messages ?? false,
        empireAttacked: preferencesData.events.empire_attacked ?? true,
      })
    }
  }, [preferencesData])

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      await updatePreferences({
        notifications: {
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
        },
        events: {
          construction_completed: settings.constructionCompleted,
          research_completed: settings.researchCompleted,
          fleet_arrived: settings.fleetArrived,
          fleet_attacked: settings.fleetAttacked,
          planet_colonized: settings.planetColonized,
          alliance_messages: settings.allianceMessage,
          empire_attacked: settings.empireAttacked,
        },
      }).unwrap()
      toast.success('Notification settings saved!')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save notification settings')
    }
  }

  const handleReset = () => {
    setSettings({
      emailNotifications: false,
      pushNotifications: true,
      constructionCompleted: true,
      researchCompleted: true,
      fleetArrived: true,
      fleetAttacked: true,
      planetColonized: true,
      allianceMessage: false,
      empireAttacked: true,
    })
    toast.success('Settings reset to defaults')
  }

  if (isLoadingPreferences) {
    return (
      <Card className="panel-glass">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* General Notifications */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            General Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Event Notifications */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Game Events
          </CardTitle>
          <CardDescription>
            Choose which game events trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="construction-completed">Construction Completed</Label>
                <p className="text-sm text-muted-foreground">
                  When buildings finish construction
                </p>
              </div>
              <Switch
                id="construction-completed"
                checked={settings.constructionCompleted}
                onCheckedChange={(checked) => handleSettingChange('constructionCompleted', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="research-completed">Research Completed</Label>
                <p className="text-sm text-muted-foreground">
                  When research projects finish
                </p>
              </div>
              <Switch
                id="research-completed"
                checked={settings.researchCompleted}
                onCheckedChange={(checked) => handleSettingChange('researchCompleted', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fleet-arrived">Fleet Arrived</Label>
                <p className="text-sm text-muted-foreground">
                  When your fleets reach their destination
                </p>
              </div>
              <Switch
                id="fleet-arrived"
                checked={settings.fleetArrived}
                onCheckedChange={(checked) => handleSettingChange('fleetArrived', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fleet-attacked">Fleet Attacked</Label>
                <p className="text-sm text-muted-foreground">
                  When your fleets are attacked
                </p>
              </div>
              <Switch
                id="fleet-attacked"
                checked={settings.fleetAttacked}
                onCheckedChange={(checked) => handleSettingChange('fleetAttacked', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="planet-colonized">Planet Colonized</Label>
                <p className="text-sm text-muted-foreground">
                  When you colonize new planets
                </p>
              </div>
              <Switch
                id="planet-colonized"
                checked={settings.planetColonized}
                onCheckedChange={(checked) => handleSettingChange('planetColonized', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alliance-message">Alliance Messages</Label>
                <p className="text-sm text-muted-foreground">
                  When you receive alliance messages
                </p>
              </div>
              <Switch
                id="alliance-message"
                checked={settings.allianceMessage}
                onCheckedChange={(checked) => handleSettingChange('allianceMessage', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="empire-attacked">Empire Attacked</Label>
                <p className="text-sm text-muted-foreground">
                  When your empire is under attack
                </p>
              </div>
              <Switch
                id="empire-attacked"
                checked={settings.empireAttacked}
                onCheckedChange={(checked) => handleSettingChange('empireAttacked', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

