import { toast } from 'sonner'
import { AppDispatch } from '@/app/store'
import { addNotification, Notification } from '@/app/slices/notificationSlice'

/**
 * Shows a toast notification AND saves it to the notification tray for retention
 * This ensures all notifications are accessible later via the notification center
 */
export function notifyWithToast(
  dispatch: AppDispatch,
  options: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    description?: string
    category?: Notification['category']
    actionUrl?: string
    data?: any
    toastOptions?: {
      duration?: number
      description?: string
    }
  }
) {
  const { type, title, message, description, category = 'general', actionUrl, data, toastOptions } = options
  
  // Show toast notification
  const toastDescription = description || message || ''
  if (type === 'success') {
    toast.success(title, {
      description: toastDescription,
      ...toastOptions,
    })
  } else if (type === 'error') {
    toast.error(title, {
      description: toastDescription,
      ...toastOptions,
    })
  } else if (type === 'warning') {
    toast.warning(title, {
      description: toastDescription,
      ...toastOptions,
    })
  } else {
    toast.info(title, {
      description: toastDescription,
      ...toastOptions,
    })
  }
  
  // Save to notification tray
  dispatch(addNotification({
    type,
    title,
    message: message || description || title,
    category,
    actionUrl,
    data,
  }))
}

