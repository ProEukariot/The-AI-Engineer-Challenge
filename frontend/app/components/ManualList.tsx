'use client'

import { useState } from 'react'
import { FileText, Clock, ChevronRight, BookOpen } from 'lucide-react'

interface Manual {
  manual_id: string
  filename: string
  upload_time: string
  sections: Array<{
    title: string
    type: string
  }>
}

interface ManualListProps {
  manuals: Manual[]
  selectedManual: Manual | null
  onSelectManual: (manual: Manual) => void
}

export default function ManualList({ manuals, selectedManual, onSelectManual }: ManualListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredManuals = manuals.filter(manual =>
    manual.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatUploadTime = (timestamp: string) => {
    const date = new Date(parseFloat(timestamp) * 1000)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getSectionTypeColor = (type: string) => {
    switch (type) {
      case 'procedure':
        return 'section-procedure'
      case 'troubleshooting':
        return 'section-troubleshooting'
      case 'specification':
        return 'section-specification'
      default:
        return 'section-general'
    }
  }

  if (manuals.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">No manuals uploaded yet</p>
        <p className="text-gray-400 text-xs mt-1">Upload your first manual to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search manuals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field text-sm"
        />
      </div>

      {/* Manual List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredManuals.map((manual) => (
          <div
            key={manual.manual_id}
            onClick={() => onSelectManual(manual)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedManual?.manual_id === manual.manual_id
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {manual.filename}
                  </h3>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatUploadTime(manual.upload_time)}</span>
                </div>

                {/* Section Types */}
                <div className="flex flex-wrap gap-1">
                  {manual.sections.slice(0, 3).map((section, index) => (
                    <span
                      key={index}
                      className={`section-badge ${getSectionTypeColor(section.type)}`}
                    >
                      {section.type}
                    </span>
                  ))}
                  {manual.sections.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{manual.sections.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>

      {filteredManuals.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No manuals found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}
