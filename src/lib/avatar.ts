/**
 * Avatar utility functions for handling avatar URLs
 */

/**
 * Converts a relative avatar path to a full URL
 * @param avatarPath - Relative path from API (e.g., /storage/avatars/users/1/abc123.jpg)
 * @returns Full URL for the avatar image
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) {
    return null
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
