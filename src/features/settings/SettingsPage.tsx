import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useGetMeQuery, useUpdateProfileMutation, useLogoutMutation } from '@/api/endpoints/authApi'
import { useGetAllianceDetailsQuery } from '@/api/endpoints/alliancesApi'
import { formatNumber } from '@/lib/formatters'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield,
  Key,
  LogOut,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { ProfileSettings } from './components/ProfileSettings'
import { NotificationSettings } from './components/NotificationSettings'
import { AccountSettings } from './components/AccountSettings'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'account'>('profile')
  const [showApiToken, setShowApiToken] = useState(false)

  const { data: meData, isLoading } = useGetMeQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [logout] = useLogoutMutation()

  const user = meData?.user
  const empire = meData?.empire

  // Fetch alliance data if user is in an alliance
  const { data: allianceData } = useGetAllianceDetailsQuery(
    Number(empire?.alliance_id) || 0,
    { skip: !empire?.alliance_id }
  )

  const allianceName = allianceData?.alliance?.name || 
    (empire?.alliance as any)?.name || 
    (empire?.alliance_id ? 'Loading...' : 'Independent')

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout().unwrap()
        toast.success('Logged out successfully')
        // Redirect will be handled by AuthGuard
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to logout')
      }
    }
  }

  const copyApiToken = () => {
    if (user?.api_token) {
      navigator.clipboard.writeText(user.api_token)
      toast.success('API token copied to clipboard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="panel-glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Account Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg">{user?.username || 'Unknown'}</h3>
              <p className="text-muted-foreground">{user?.email || 'No email'}</p>
              <Badge variant="outline" className="mt-2">
                {user?.role || 'Player'}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{empire?.name || 'Unknown Empire'}</h3>
              <p className="text-muted-foreground">Empire ID: {empire?.id || 'N/A'}</p>
              <Badge variant="outline" className="mt-2">
                Score: {empire?.score ? empire.score.toLocaleString() : '0'}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold text-lg">API Access</h3>
              <p className="text-muted-foreground">Token expires: {user?.token_expires_at ? new Date(user.token_expires_at).toLocaleDateString() : 'Never'}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiToken(!showApiToken)}
                className="mt-2"
              >
                {showApiToken ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showApiToken ? 'Hide' : 'Show'} Token
              </Button>
            </div>
          </div>

          {/* API Token Display */}
          {showApiToken && user?.api_token && (
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">API Token:</p>
                  <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                    {user.api_token}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyApiToken}
                  className="ml-4"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Your account activity and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Joined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {empire?.planets_owned ?? empire?.planets?.length ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Planets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatNumber(empire?.score || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {allianceName}
              </div>
              <div className="text-sm text-muted-foreground">Alliance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings
            user={user}
            empire={empire}
            onUpdate={updateProfile}
            isLoading={isUpdating}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSettings
            onLogout={handleLogout}
            user={user}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

