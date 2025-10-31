/**
 * Avatar utility functions for handling avatar URLs
 */

/**
 * Converts a relative avatar path or full URL to a full URL
 * @param avatarPath - Relative path from API (e.g., /storage/avatars/users/1/abc123.jpg) or full URL
 * @returns Full URL for the avatar image
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) {
    return null
  }

  // If it's already a full URL (starts with http:// or https://), return it as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }

  // Get API base URL from environment
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
  
  // Remove /api/v1 from the base URL and append the avatar path
  // Example: http://localhost:8080/api/v1 -> http://localhost:8080
  const baseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '')
  
  // Ensure avatar path starts with /
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`
  
  return `${baseUrl}${normalizedPath}`
}

/**
 * Gets the avatar URL from a user object, preferring avatar_url over avatar_path
 * @param user - User object with optional avatar_url or avatar_path
 * @returns Avatar URL or null if no avatar is available
 */
export function getUserAvatarUrl(user: { avatar_url?: string | null; avatar_path?: string | null } | null | undefined): string | null {
  if (!user) return null
  // Prefer avatar_url (new) over avatar_path (deprecated)
  const avatarPath = user.avatar_url || user.avatar_path
  return getAvatarUrl(avatarPath)
}

/**
 * Gets initials from a name (for fallback avatar display)
 * @param name - Name to extract initials from
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
