import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    // General Notifications
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    
    // Game Events
    constructionCompleted: true,
    researchCompleted: true,
    fleetArrived: true,
    fleetAttacked: true,
    planetColonized: true,
    allianceMessage: true,
    empireAttacked: true,
    
    // Frequency Settings
    notificationFrequency: 'immediate', // immediate, hourly, daily
    digestFrequency: 'daily', // daily, weekly, never
    
    // Channel Preferences
    emailChannel: true,
    inGameChannel: true,
    webhookChannel: false,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Notification settings saved!')
    } catch (error) {
      toast.error('Failed to save notification settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: false,
      soundEnabled: true,
      constructionCompleted: true,
      researchCompleted: true,
      fleetArrived: true,
      fleetAttacked: true,
      planetColonized: true,
      allianceMessage: true,
      empireAttacked: true,
      notificationFrequency: 'immediate',
      digestFrequency: 'daily',
      emailChannel: true,
      inGameChannel: true,
      webhookChannel: false,
    })
    toast.success('Settings reset to defaults')
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for notifications
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
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

      {/* Frequency Settings */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-400" />
            Frequency Settings
          </CardTitle>
          <CardDescription>
            Control how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="notification-frequency">Notification Frequency</Label>
            <Select
              value={settings.notificationFrequency}
              onValueChange={(value) => handleSettingChange('notificationFrequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often to receive individual notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="digest-frequency">Digest Frequency</Label>
            <Select
              value={settings.digestFrequency}
              onValueChange={(value) => handleSettingChange('digestFrequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often to receive summary digests
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Channel Preferences */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Channel Preferences
          </CardTitle>
          <CardDescription>
            Choose which channels to receive notifications through
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-channel">Email Channel</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-channel"
              checked={settings.emailChannel}
              onCheckedChange={(checked) => handleSettingChange('emailChannel', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-game-channel">In-Game Channel</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications in the game interface
              </p>
            </div>
            <Switch
              id="in-game-channel"
              checked={settings.inGameChannel}
              onCheckedChange={(checked) => handleSettingChange('inGameChannel', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="webhook-channel">Webhook Channel</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications to external webhooks
              </p>
            </div>
            <Switch
              id="webhook-channel"
              checked={settings.webhookChannel}
              onCheckedChange={(checked) => handleSettingChange('webhookChannel', checked)}
            />
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

