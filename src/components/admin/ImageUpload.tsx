'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  // Lets the parent form know a file is mid-upload so it can disable its
  // Save button — without this, saving while an upload is still in flight
  // would submit the form before `onChange(url)` ever fires, silently
  // dropping the new image (looked like "the upload feature is broken").
  onUploadingChange?: (uploading: boolean) => void
}

export default function ImageUpload({ value, onChange, folder = 'trade-in', onUploadingChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const setUploadingState = (v: boolean) => {
    setUploading(v)
    onUploadingChange?.(v)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingState(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.url) {
        onChange(data.url)
      }
    } finally {
      setUploadingState(false)
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <Image src={value} alt="Upload" width={96} height={96} className="w-24 h-24 object-cover rounded-lg border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${uploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
          {uploading ? (
            <div className="text-sm text-gray-500">Uploading...</div>
          ) : (
            <>
              <span className="text-2xl mb-1">📷</span>
              <span className="text-sm text-gray-500">Click to upload image</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  )
}