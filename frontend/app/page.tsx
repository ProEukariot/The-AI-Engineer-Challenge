'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, MessageCircle, Search, BookOpen, HelpCircle } from 'lucide-react'
import ManualUpload from './components/ManualUpload'
import ManualQuery from './components/ManualQuery'
import ManualList from './components/ManualList'

interface Manual {
  manual_id: string
  filename: string
  upload_time: string
  sections: Array<{
    title: string
    type: string
  }>
}

export default function Home() {
  const [manuals, setManuals] = useState<Manual[]>([])
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchManuals()
  }, [])

  const fetchManuals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/manuals`)
      if (response.ok) {
        const data = await response.json()
        setManuals(data.manuals)
      }
    } catch (error) {
      console.error('Error fetching manuals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualUploaded = () => {
    fetchManuals()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Manual Q&A Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <HelpCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Ask questions about your manuals</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Manual Management */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upload Section */}
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <Upload className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Upload Manual</h2>
                </div>
                <ManualUpload onUploaded={handleManualUploaded} />
              </div>

              {/* Manual List */}
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Your Manuals</h2>
                </div>
                <ManualList 
                  manuals={manuals}
                  selectedManual={selectedManual}
                  onSelectManual={setSelectedManual}
                />
              </div>
            </div>

            {/* Right Side - Q&A Interface */}
            <div className="lg:col-span-2">
              {selectedManual ? (
                <div className="card">
                  <div className="flex items-center space-x-2 mb-6">
                    <MessageCircle className="h-5 w-5 text-primary-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Ask Questions</h2>
                      <p className="text-sm text-gray-500">About: {selectedManual.filename}</p>
                    </div>
                  </div>
                  <ManualQuery manual={selectedManual} />
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Manual</h3>
                  <p className="text-gray-500">
                    Choose a manual from the list to start asking questions, or upload a new one.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Manual Q&A Assistant - Get instant answers from your user manuals</p>
          </div>
        </div>
      </footer>
    </div>
  )
}