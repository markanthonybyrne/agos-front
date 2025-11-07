import { useState, useEffect, useRef } from 'react'

interface ImageBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
  imageWidth: number
  imageHeight: number
}

interface PlanetImageScale {
  scale: number
  offsetX: number
  offsetY: number
  isLoading: boolean
}

// Cache for analyzed images
const imageBoundsCache = new Map<string, ImageBounds>()

/**
 * Analyze an image to find the actual content bounds (ignoring transparent/background padding)
 */
async function analyzeImageBounds(imageUrl: string): Promise<ImageBounds> {
  // Check cache first
  if (imageBoundsCache.has(imageUrl)) {
    return imageBoundsCache.get(imageUrl)!
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0)
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Find bounds of non-transparent content
      let minX = canvas.width
      let maxX = 0
      let minY = canvas.height
      let maxY = 0
      
      // Sample pixels (every 4th pixel for performance)
      const sampleRate = 4
      for (let y = 0; y < canvas.height; y += sampleRate) {
        for (let x = 0; x < canvas.width; x += sampleRate) {
          const index = (y * canvas.width + x) * 4
          const alpha = data[index + 3]
          
          // Consider pixel as content if alpha > threshold (not fully transparent)
          // Also check if it's not pure black/white background
          if (alpha > 10) {
            const r = data[index]
            const g = data[index + 1]
            const b = data[index + 2]
            
            // Skip pure black or pure white pixels (likely background)
            const isBackground = (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)
            
            if (!isBackground) {
              minX = Math.min(minX, x)
              maxX = Math.max(maxX, x)
              minY = Math.min(minY, y)
              maxY = Math.max(maxY, y)
            }
          }
        }
      }
      
      // If no content found, use full image
      if (minX >= maxX || minY >= maxY) {
        minX = 0
        maxX = canvas.width
        minY = 0
        maxY = canvas.height
      }
      
      const bounds: ImageBounds = {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        imageWidth: canvas.width,
        imageHeight: canvas.height,
      }
      
      // Cache the result
      imageBoundsCache.set(imageUrl, bounds)
      resolve(bounds)
    }
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`))
    }
    
    img.src = imageUrl
  })
}

/**
 * Calculate scale and offset to normalize planet images to a target size
 * @param imageUrl - URL of the planet image
 * @param targetSize - Target size in pixels (default 730px to match hex grid)
 * @param referenceContentSize - Reference content size for normalization (default 600px)
 */
export function usePlanetImageScale(
  imageUrl: string | undefined,
  targetSize: number = 730,
  referenceContentSize: number = 600
): PlanetImageScale {
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false)
      return
    }

    // Cancel previous analysis if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    analyzeImageBounds(imageUrl)
      .then((bounds) => {
        if (abortControllerRef.current?.signal.aborted) return

        // Calculate the actual content size (smaller dimension for circular planets)
        const contentSize = Math.min(bounds.width, bounds.height)
        
        // Calculate scale to normalize all planets to the same visual size
        // We want the content to appear at targetSize (730px), so we scale based on content size
        // Images with more padding (smaller content relative to image) will scale up more
        // If content is 400px in an 800px image, and we want it to appear as 730px:
        // We need to scale the image so the 400px content becomes 730px
        // Scale = 730 / 400 = 1.825
        // Since we're using object-fit: cover, we need to scale enough to fill the container
        const baseScale = targetSize / contentSize
        // Ensure minimum scale of 1.0 (never scale down) and add a boost for images with padding
        const scaleToNormalize = Math.max(baseScale, 1.0)
        
        // The image is displayed in a targetSize container with object-fit: cover
        // We scale the image so the content appears at the target size
        // Add a minimum scale boost to ensure planets fill the space properly
        const finalScale = Math.max(scaleToNormalize, 1.3) // Minimum 1.3x to ensure good fill
        
        // Calculate offset to center the content within the image
        // The content center should align with the container center
        const imageCenterX = bounds.imageWidth / 2
        const imageCenterY = bounds.imageHeight / 2
        const contentCenterX = bounds.centerX
        const contentCenterY = bounds.centerY
        
        // Offset needed to move content center to image center (in scaled coordinates)
        // This ensures the planet content is centered in the view
        const offsetX = (imageCenterX - contentCenterX) * finalScale
        const offsetY = (imageCenterY - contentCenterY) * finalScale

        setScale(finalScale)
        setOffsetX(offsetX)
        setOffsetY(offsetY)
        setIsLoading(false)
      })
      .catch((error) => {
        if (abortControllerRef.current?.signal.aborted) return
        console.warn('Failed to analyze planet image bounds:', error)
        // Fallback to no scaling
        setScale(1)
        setOffsetX(0)
        setOffsetY(0)
        setIsLoading(false)
      })

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [imageUrl, targetSize, referenceContentSize])

  return { scale, offsetX, offsetY, isLoading }
}

