'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface ManualUploadProps {
  onUploaded: () => void
}

export default function ManualUpload({ onUploaded }: ManualUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error')
      setMessage('Please select a PDF file')
      return
    }

    setUploading(true)
    setUploadStatus('idle')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/upload-manual`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setUploadStatus('success')
        setMessage(`Successfully uploaded ${result.filename} with ${result.sections_count} sections`)
        onUploaded()
      } else {
        const error = await response.json()
        setUploadStatus('error')
        setMessage(error.detail || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading
            ? 'border-primary-300 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Processing manual...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">Upload a PDF manual</p>
              <p className="text-xs text-gray-500">Drag and drop or click to select</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-sm"
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {uploadStatus !== 'idle' && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          uploadStatus === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {uploadStatus === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported format: PDF only</p>
        <p>• Manuals are processed for optimal Q&A</p>
        <p>• Large files may take a moment to process</p>
      </div>
    </div>
  )
}
