import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useGetEmpiresQuery } from '@/api/endpoints/empiresApi'
import { useSendMailMutation, useReplyMailMutation } from '@/api/endpoints/mailApi'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Mail } from '@/types/api.types'
import { EmpireSelector } from './EmpireSelector'

interface ComposeMailPanelProps {
  replyToMail?: Mail | null
  onSuccess?: () => void
}

export function ComposeMailPanel({ replyToMail, onSuccess }: ComposeMailPanelProps) {
  const { data: empiresData } = useGetEmpiresQuery({ page: 1, per_page: 100 })
  const [sendMail, { isLoading: isSending }] = useSendMailMutation()
  const [replyMail, { isLoading: isReplying }] = useReplyMailMutation()
  
  const [formData, setFormData] = useState({
    to_empire_id: replyToMail ? (replyToMail.from_empire?.id || replyToMail.to_empire?.id || 0) : 0,
    subject: replyToMail ? `Re: ${replyToMail.subject}` : '',
    body: '',
  })

  const isLoading = isSending || isReplying

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (replyToMail) {
      // Handle reply
      try {
        await replyMail({
          original_mail_id: replyToMail.id,
          subject: formData.subject,
          body: formData.body,
        }).unwrap()
        toast.success('Reply sent successfully')
        onSuccess?.()
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to send reply')
      }
    } else {
      // Handle new message
      if (!formData.to_empire_id || !formData.subject || !formData.body) {
        toast.error('Please fill in all fields')
        return
      }
      
      try {
        await sendMail({
          to_empire_id: formData.to_empire_id,
          subject: formData.subject,
          body: formData.body,
        }).unwrap()
        toast.success('Message sent successfully')
        // Reset form
        setFormData({
          to_empire_id: 0,
          subject: '',
          body: '',
        })
        onSuccess?.()
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to send message')
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to_empire" className="mb-2 block">To</Label>
            <EmpireSelector
              empires={empiresData?.data || []}
              value={formData.to_empire_id}
              onChange={(empireId) => setFormData({ ...formData, to_empire_id: empireId })}
              disabled={!!replyToMail || isLoading}
              placeholder="Select an empire..."
            />
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
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder={replyToMail ? "Type your reply here..." : "Enter your message..."}
              rows={10}
              maxLength={10000}
              required
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.body.length}/10000 characters
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button 
              type="submit" 
              disabled={isLoading || formData.to_empire_id === 0 || !formData.subject || !formData.body}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {replyToMail ? 'Sending Reply...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {replyToMail ? 'Send Reply' : 'Send Message'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

