import { useEffect, useRef, useState } from 'react'
import defaultPortrait from '../../assets/toe.png'

type CropSource = {
  src: string
  naturalWidth: number
  naturalHeight: number
  displayWidth: number
  displayHeight: number
}

type CropRect = {
  x: number
  y: number
  size: number
}

type DragState = {
  pointerId: number
  offsetX: number
  offsetY: number
}

const CROP_MAX_WIDTH = 320
const CROP_MAX_HEIGHT = 240

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image'))
    image.src = source
  })
}

function getDisplayDimensions(naturalWidth: number, naturalHeight: number): {
  width: number
  height: number
} {
  const scale = Math.min(CROP_MAX_WIDTH / naturalWidth, CROP_MAX_HEIGHT / naturalHeight, 1)

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale))
  }
}

async function uploadCroppedPortrait(imageBlob: Blob): Promise<string> {
  if (!window.api?.savePlayerPortrait) {
    throw new Error('Local portrait storage is unavailable. Run this in the Electron desktop app.')
  }

  const imageBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to process portrait image.'))
        return
      }

      const [, base64Payload] = result.split(',')
      if (!base64Payload) {
        reject(new Error('Failed to extract portrait image bytes.'))
        return
      }

      resolve(base64Payload)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read portrait image.'))
    }

    reader.readAsDataURL(imageBlob)
  })

  const response = await window.api.savePlayerPortrait(imageBase64)
  if (!response.url) {
    throw new Error('Failed to save portrait locally.')
  }

  return response.url
}

function PlayerPortrait(): React.JSX.Element {
  const [portraitUrl, setPortraitUrl] = useState<string>(defaultPortrait)
  const [cropSource, setCropSource] = useState<CropSource | null>(null)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, size: 80 })
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const customObjectUrlRef = useRef<string | null>(null)
  const pendingObjectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        if (!window.api?.loadPlayerPortrait) {
          setUploadError('Local portrait storage is unavailable. Run this in the Electron desktop app.')
          return
        }

        const { url } = await window.api.loadPlayerPortrait()
        if (url) {
          setPortraitUrl(url)
        }
      } catch {
        setUploadError('Could not load your saved portrait. Using placeholder image.')
      }
    })()

    return () => {
      if (customObjectUrlRef.current) {
        URL.revokeObjectURL(customObjectUrlRef.current)
      }

      if (pendingObjectUrlRef.current) {
        URL.revokeObjectURL(pendingObjectUrlRef.current)
      }
    }
  }, [])

  const handlePickImage = (): void => {
    inputRef.current?.click()
  }

  const closeCropEditor = (): void => {
    if (pendingObjectUrlRef.current) {
      URL.revokeObjectURL(pendingObjectUrlRef.current)
      pendingObjectUrlRef.current = null
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setCropSource(null)
    setDragState(null)
  }

  const handleResetImage = (): void => {
    if (window.api?.clearPlayerPortrait) {
      void window.api.clearPlayerPortrait()
    }

    if (customObjectUrlRef.current) {
      URL.revokeObjectURL(customObjectUrlRef.current)
      customObjectUrlRef.current = null
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setUploadError(null)
    setPortraitUrl(defaultPortrait)
    closeCropEditor()
  }

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadError(null)
    closeCropEditor()

    const objectUrl = URL.createObjectURL(file)
    pendingObjectUrlRef.current = objectUrl

    try {
      const image = await loadImage(objectUrl)
      const { width, height } = getDisplayDimensions(image.naturalWidth, image.naturalHeight)
      const initialSize = Math.max(40, Math.floor(Math.min(width, height) * 0.6))

      setCropSource({
        src: objectUrl,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        displayWidth: width,
        displayHeight: height
      })

      setCropRect({
        x: Math.floor((width - initialSize) / 2),
        y: Math.floor((height - initialSize) / 2),
        size: initialSize
      })
    } catch {
      setUploadError('Could not open that image. Please try PNG, JPG, or WEBP.')
      closeCropEditor()
    }
  }

  const handleCropConfirm = async (): Promise<void> => {
    if (!cropSource || isUploading) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const image = await loadImage(cropSource.src)
      const scaleX = cropSource.naturalWidth / cropSource.displayWidth
      const scaleY = cropSource.naturalHeight / cropSource.displayHeight

      const sourceX = Math.round(cropRect.x * scaleX)
      const sourceY = Math.round(cropRect.y * scaleY)
      const sourceSizeX = Math.max(1, Math.round(cropRect.size * scaleX))
      const sourceSizeY = Math.max(1, Math.round(cropRect.size * scaleY))

      const outputSize = 256
      const canvas = document.createElement('canvas')
      canvas.width = outputSize
      canvas.height = outputSize

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not initialize image processing canvas.')
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSizeX,
        sourceSizeY,
        0,
        0,
        outputSize,
        outputSize
      )

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => {
          resolve(result)
        }, 'image/png')
      })

      if (!blob) {
        throw new Error('Could not build cropped image.')
      }

      const cdnPortraitUrl = await uploadCroppedPortrait(blob)

      if (customObjectUrlRef.current) {
        URL.revokeObjectURL(customObjectUrlRef.current)
        customObjectUrlRef.current = null
      }

      setPortraitUrl(cdnPortraitUrl)
      closeCropEditor()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Portrait upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCropCancel = (): void => {
    if (isUploading) {
      return
    }

    closeCropEditor()
  }

  const handleFramePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!cropSource) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    setDragState({
      pointerId: event.pointerId,
      offsetX: event.clientX - cropRect.x,
      offsetY: event.clientY - cropRect.y
    })
  }

  const handleFramePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!cropSource || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()

    const nextX = clamp(event.clientX - dragState.offsetX, 0, cropSource.displayWidth - cropRect.size)
    const nextY = clamp(event.clientY - dragState.offsetY, 0, cropSource.displayHeight - cropRect.size)

    setCropRect((current) => ({ ...current, x: nextX, y: nextY }))
  }

  const handleFramePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (dragState?.pointerId !== event.pointerId) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragState(null)
  }

  return (
    <section className="player-panel" aria-label="Player portrait">
      <h2 className="panel-title">Player</h2>
      <img className="player-avatar" src={portraitUrl} alt="Player portrait" />
      {cropSource ? (
        <section className="crop-editor" aria-label="Image crop editor">
          <p className="crop-instruction">Drag the frame to choose your portrait crop.</p>
          <div
            className="crop-stage"
            style={{ width: cropSource.displayWidth, height: cropSource.displayHeight }}
          >
            <img
              className="crop-image"
              src={cropSource.src}
              width={cropSource.displayWidth}
              height={cropSource.displayHeight}
              alt="Selected image preview"
              draggable={false}
            />
            <div
              className="crop-frame"
              style={{ left: cropRect.x, top: cropRect.y, width: cropRect.size, height: cropRect.size }}
              onPointerDown={handleFramePointerDown}
              onPointerMove={handleFramePointerMove}
              onPointerUp={handleFramePointerUp}
            />
          </div>
          <div className="portrait-actions">
            <button className="btn primary" onClick={handleCropConfirm} type="button" disabled={isUploading}>
              {isUploading ? 'Saving...' : 'Confirm'}
            </button>
            <button className="btn" onClick={handleCropCancel} type="button" disabled={isUploading}>
              Cancel
            </button>
          </div>
        </section>
      ) : (
        <div className="portrait-actions">
          <button className="btn" onClick={handlePickImage} type="button" disabled={isUploading}>
            Upload Image
          </button>
          <button className="btn" onClick={handleResetImage} type="button" disabled={isUploading}>
            Use Placeholder
          </button>
        </div>
      )}
      {uploadError ? <p className="portrait-error">{uploadError}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="visually-hidden"
      />
    </section>
  )
}

export default PlayerPortrait
