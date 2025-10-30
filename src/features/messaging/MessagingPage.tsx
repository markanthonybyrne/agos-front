import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useGetMailQuery, useSendMailMutation, useReplyMailMutation, useDeleteMailMutation, useGetMailDetailsQuery } from '@/api/endpoints/mailApi'
import { useGetEmpiresQuery } from '@/api/endpoints/empiresApi'
import { formatDate } from '@/lib/formatters'
import { 
  Mail, 
  Send, 
  Trash2, 
  Plus, 
  Inbox, 
  Send as SendIcon,
  Search,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Reply
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

type MailType = 'inbox' | 'sent'

export function MessagingPage() {
  const [activeTab, setActiveTab] = useState<MailType>('inbox')
  const [selectedMail, setSelectedMail] = useState<number | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyToMail, setReplyToMail] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'thread'>('list')
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: inboxData, isLoading: isLoadingInbox, error: inboxError } = useGetMailQuery({
    type: 'inbox',
    page: currentPage,
    per_page: 25,
  })

  const { data: sentData, isLoading: isLoadingSent, error: sentError } = useGetMailQuery({
    type: 'sent',
    page: currentPage,
    per_page: 25,
  })

  const { data: empiresData } = useGetEmpiresQuery({ page: 1, per_page: 100 })
  const [sendMail, { isLoading: isSending }] = useSendMailMutation()
  const [replyMail, { isLoading: isReplying }] = useReplyMailMutation()
  const [deleteMail, { isLoading: isDeleting }] = useDeleteMailMutation()
  
  // Fetch mail details when a message is selected
  const { data: mailDetails } = useGetMailDetailsQuery(selectedMail || 0, {
    skip: !selectedMail
  })

  const currentData = activeTab === 'inbox' ? inboxData : sentData
  const isLoading = activeTab === 'inbox' ? isLoadingInbox : isLoadingSent


  const filteredMail = currentData?.data?.filter((mail) =>
    mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mail.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activeTab === 'inbox' ? mail.from_empire.name : mail.to_empire.name)
      .toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Group messages by thread (using subject as thread identifier for now)
  const groupedThreads = filteredMail.reduce((acc, mail) => {
    const threadKey = mail.thread_id || mail.subject
    if (!acc[threadKey]) {
      acc[threadKey] = []
    }
    acc[threadKey].push(mail)
    return acc
  }, {} as Record<string, typeof filteredMail>)

  // Sort threads by most recent message
  const sortedThreads = Object.entries(groupedThreads).sort(([, a], [, b]) => {
    const aLatest = Math.max(...a.map(m => new Date(m.created_at).getTime()))
    const bLatest = Math.max(...b.map(m => new Date(m.created_at).getTime()))
    return bLatest - aLatest
  })

  const handleSendMail = async (data: { to_empire_id: number; subject: string; body: string }) => {
    try {
      await sendMail(data).unwrap()
      toast.success('Message sent successfully')
      setComposeOpen(false)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send message')
    }
  }

  const handleReplyMail = async (data: { body: string }) => {
    if (!replyToMail) return
    
    // Get the original message to extract subject and determine recipient
    const originalMail = currentData?.data.find(m => m.id === replyToMail)
    if (!originalMail) return
    
    try {
      await replyMail({
        original_mail_id: replyToMail,
        subject: `Re: ${originalMail.subject}`,
        body: data.body,
      }).unwrap()
      toast.success('Reply sent successfully')
      setReplyOpen(false)
      setReplyToMail(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send reply')
    }
  }

  const handleDeleteMail = async (id: number) => {
    try {
      await deleteMail(id).unwrap()
      toast.success('Message deleted')
      if (selectedMail === id) {
        setSelectedMail(null)
      }
    } catch (error: any) {
      toast.error('Failed to delete message')
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as MailType)
    setCurrentPage(1)
    setSelectedMail(null)
  }

  const handleSelectMail = (mailId: number) => {
    setSelectedMail(mailId)
    // Mark as read if it's an inbox message and unread
    if (activeTab === 'inbox') {
      const mail = currentData?.data.find(m => m.id === mailId)
      if (mail && !mail.is_read) {
        // The mail will be marked as read when we fetch the details
        // This is handled by the backend when we call getMailDetails
      }
    }
  }

  const renderMailList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      )
    }

    // Show error if there's an API error
    const currentError = activeTab === 'inbox' ? inboxError : sentError
    if (currentError) {
      return (
        <div className="text-center py-8 text-destructive">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Error loading messages</p>
          <p className="text-sm text-muted-foreground mt-2">
            {((currentError as any)?.data?.message) || 'Unknown error occurred'}
          </p>
        </div>
      )
    }

    if (filteredMail.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No messages found</p>
          <p className="text-xs mt-2">
            {activeTab === 'sent' ? 'You haven\'t sent any messages yet' : 'No messages in your inbox'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {filteredMail.map((mail) => (
          <div
            key={mail.id}
            className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedMail === mail.id ? 'bg-muted/30 border-primary' : 'border-border'
            } ${!mail.is_read && activeTab === 'inbox' ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
            onClick={() => handleSelectMail(mail.id)}
          >
            <div className="flex-shrink-0">
              {!mail.is_read && activeTab === 'inbox' ? (
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
              ) : (
                <Mail className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate">
                  {activeTab === 'inbox' ? mail.from_empire.name : mail.to_empire.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(mail.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMail(mail.id)
                    }}
                    disabled={isDeleting}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {mail.subject}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {mail.body.substring(0, 100)}...
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderThreadList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      )
    }

    // Show error if there's an API error
    const currentError = activeTab === 'inbox' ? inboxError : sentError
    if (currentError) {
      return (
        <div className="text-center py-8 text-destructive">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Error loading messages</p>
          <p className="text-sm text-muted-foreground mt-2">
            {((currentError as any)?.data?.message) || 'Unknown error occurred'}
          </p>
        </div>
      )
    }

    if (sortedThreads.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No conversations found</p>
          <p className="text-xs mt-2">
            {activeTab === 'sent' ? 'You haven\'t started any conversations yet' : 'No conversations in your inbox'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {sortedThreads.map(([threadKey, messages]) => {
          const latestMessage = messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          const unreadCount = messages.filter(m => !m.is_read && activeTab === 'inbox').length
          
          return (
            <div
              key={threadKey}
              className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedThread === threadKey ? 'bg-muted/30 border-primary' : 'border-border'
              } ${unreadCount > 0 ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
              onClick={() => setSelectedThread(threadKey)}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {activeTab === 'inbox' ? latestMessage.from_empire.name : latestMessage.to_empire.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(latestMessage.created_at)}
                    </p>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {latestMessage.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {latestMessage.body.substring(0, 100)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderPagination = () => {
    if (!currentData?.meta) return null

    const { page, per_page, total } = currentData.meta
    const totalPages = Math.ceil(total / per_page)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {((page - 1) * per_page) + 1} to {Math.min(page * per_page, total)} of {total} messages
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page - 1)}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page + 1)}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderMailDetails = () => {
    // If in thread mode and a thread is selected, show thread conversation
    if (viewMode === 'thread' && selectedThread) {
      const threadMessages = groupedThreads[selectedThread] || []
      if (threadMessages.length === 0) return null

      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{threadMessages[0].subject}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  {activeTab === 'inbox' ? threadMessages[0].from_empire.name : threadMessages[0].to_empire.name}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm">{threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'inbox' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyToMail(threadMessages[0].id)
                      setReplyOpen(true)
                    }}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {threadMessages
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((mail, index) => (
                  <div key={mail.id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {activeTab === 'inbox' ? mail.from_empire.name : mail.to_empire.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(mail.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-sm">{mail.body}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    // Regular single message view
    if (!selectedMail) return null

    // Use mail details from API if available, otherwise fall back to current data
    const mail = mailDetails?.mail || currentData?.data.find(m => m.id === selectedMail)
    if (!mail) return null

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{mail.subject}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  {activeTab === 'inbox' ? mail.from_empire.name : mail.to_empire.name}
                  <span className="text-muted-foreground">•</span>
                  <Clock className="w-4 h-4" />
                  {formatDate(mail.created_at)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'inbox' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyToMail(mail.id)
                      setReplyOpen(true)
                    }}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMail(mail.id)}
                  disabled={isDeleting}
                  className="text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{mail.body}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan">Messaging</h1>
          <p className="text-muted-foreground">Communicate with other empires</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>
                Send a message to another empire
              </DialogDescription>
            </DialogHeader>
            <ComposeForm
              empires={empiresData?.data || []}
              onSend={handleSendMail}
              isLoading={isSending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'thread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('thread')}
          >
            Threads
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Mail List */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Inbox
                {inboxData?.data && (
                  <Badge variant="secondary" className="ml-2">
                    {inboxData.data.filter(m => !m.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <SendIcon className="w-4 h-4" />
                Sent
                {sentData?.data && (
                  <Badge variant="secondary" className="ml-2">
                    {sentData.data.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="mt-4">
              <Card className="h-[500px] flex flex-col">
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {viewMode === 'thread' ? renderThreadList() : renderMailList()}
                </CardContent>
                {renderPagination()}
              </Card>
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              <Card className="h-[500px] flex flex-col">
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {viewMode === 'thread' ? renderThreadList() : renderMailList()}
                </CardContent>
                {renderPagination()}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mail Details */}
        <div className="lg:col-span-2">
          {(viewMode === 'thread' && selectedThread) || (viewMode === 'list' && selectedMail) ? (
            renderMailDetails()
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{viewMode === 'thread' ? 'Select a conversation to view details' : 'Select a message to view details'}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              Send a reply to this conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleReplyMail({
              body: formData.get('body') as string,
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-body">Message</Label>
              <Textarea
                id="reply-body"
                name="body"
                placeholder="Type your reply here..."
                className="min-h-[200px]"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplyOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isReplying}>
                {isReplying ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ComposeFormProps {
  empires: any[]
  onSend: (data: { to_empire_id: number; subject: string; body: string }) => void
  isLoading: boolean
}

function ComposeForm({ empires, onSend, isLoading }: ComposeFormProps) {
  const [formData, setFormData] = useState({
    to_empire_id: 0,
    subject: '',
    body: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.to_empire_id && formData.subject && formData.body) {
      onSend(formData)
      setFormData({ to_empire_id: 0, subject: '', body: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="to_empire">To</Label>
        <select
          id="to_empire"
          value={formData.to_empire_id}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, to_empire_id: Number(e.target.value) })}
          className="w-full p-2 border border-border rounded-md bg-background"
          required
        >
          <option value={0}>Select an empire...</option>
          {empires.map((empire) => (
            <option key={empire.id} value={empire.id}>
              {empire.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Enter subject..."
          maxLength={255}
          required
        />
      </div>
      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="Enter your message..."
          rows={8}
          maxLength={10000}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.body.length}/10000 characters
        </p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading || !formData.to_empire_id}>
          {isLoading ? 'Sending...' : 'Send Message'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  )
}
