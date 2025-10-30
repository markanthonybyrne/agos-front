import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetAllianceHomepageQuery } from '@/api/endpoints/alliancesApi'
import { useAuth } from '@/hooks/useAuth'
import { Crown, Users, Trophy, Globe, ExternalLink, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { formatNumber } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

interface AllianceHomepageProps {
  allianceId: number
  isMember?: boolean
}

export function AllianceHomepage({ allianceId, isMember = false }: AllianceHomepageProps) {
  const { empire } = useAuth()
  const { data, isLoading, error } = useGetAllianceHomepageQuery(allianceId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !data?.alliance) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Alliance</h3>
          <p className="text-muted-foreground text-center">
            Failed to load alliance homepage
          </p>
        </CardContent>
      </Card>
    )
  }

  const alliance = data.alliance
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  const avatarUrl = alliance.avatar_url 
    ? `${apiBaseUrl.replace('/api/v1', '')}${alliance.avatar_url.replace(/^\//, '')}`
    : undefined

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="panel-glass border-primary/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            {avatarUrl && (
              <Avatar
                src={avatarUrl}
                alt={alliance.name}
                className="w-20 h-20"
              />
            )}
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                {alliance.name}
                <Badge variant="outline">{alliance.tag}</Badge>
                {isMember && (
                  <Badge variant="secondary" className="text-xs">
                    Member
                  </Badge>
                )}
              </CardTitle>
              {alliance.mission_statement && (
                <CardDescription className="text-base mt-2">
                  {alliance.mission_statement}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{alliance.member_count}</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {formatNumber(alliance.total_score)}
              </div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(alliance.average_score)}
              </div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {alliance.leaders.length}
              </div>
              <div className="text-sm text-muted-foreground">Leaders</div>
            </div>
          </div>

          {alliance.homepage_url && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => window.open(alliance.homepage_url!, '_blank')}
                className="w-full"
              >
                <Globe className="w-4 h-4 mr-2" />
                Visit Homepage
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaders */}
      {alliance.leaders.length > 0 && (
        <Card className="panel-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alliance.leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{leader.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Score: {formatNumber(leader.score)}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Leader
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="panel-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Members ({alliance.members.length})
          </CardTitle>
          <CardDescription>
            Sorted by score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alliance.members.slice(0, 20).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
              >
                <div>
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Score: {formatNumber(member.score)} • {member.role}
                  </div>
                </div>
                {member.role === 'leader' && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Leader
                  </Badge>
                )}
              </div>
            ))}
            {alliance.members.length > 20 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                ... and {alliance.members.length - 20} more members
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
