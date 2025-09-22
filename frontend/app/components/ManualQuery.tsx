'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, BookOpen, AlertCircle, CheckCircle } from 'lucide-react'

interface Manual {
  manual_id: string
  filename: string
  upload_time: string
  sections: Array<{
    title: string
    type: string
  }>
}

interface ManualQueryProps {
  manual: Manual
}

interface QueryResponse {
  answer: string
  relevant_sections: Array<{
    title: string
    type: string
    page_number?: number
    similarity: number
    preview: string
  }>
  confidence: number
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  relevantSections?: Array<{
    title: string
    type: string
    page_number?: number
    similarity: number
    preview: string
  }>
  confidence?: number
}

export default function ManualQuery({ manual }: ManualQueryProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setStreamingResponse('')

    try {
      // Try streaming first
      const streamResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/query-manual-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          manual_id: manual.manual_id,
          model: 'gpt-4'
        }),
      })

      if (streamResponse.ok) {
        const reader = streamResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            fullResponse += chunk
            setStreamingResponse(fullResponse)
          }
        }

        // Add the final message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        setStreamingResponse('')
      } else {
        // Fallback to non-streaming
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/query-manual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: inputValue,
            manual_id: manual.manual_id,
            model: 'gpt-4',
            include_sections: true
          }),
        })

        if (response.ok) {
          const data: QueryResponse = await response.json()
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: data.answer,
            timestamp: new Date(),
            relevantSections: data.relevant_sections,
            confidence: data.confidence
          }
          setMessages(prev => [...prev, assistantMessage])
        } else {
          throw new Error('Failed to get response')
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingResponse('')
    }
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="h-[600px] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ask about {manual.filename}</h3>
            <p className="text-gray-500 text-sm">
              Ask questions about procedures, troubleshooting, specifications, or any other content in this manual.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-primary-600 text-white ml-2' 
                  : 'bg-gray-200 text-gray-600 mr-2'
              }`}>
                {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.confidence !== undefined && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <span className={`text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                      {Math.round(message.confidence * 100)}%
                    </span>
                  </div>
                )}

                {message.relevantSections && message.relevantSections.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Relevant sections:</p>
                    <div className="space-y-1">
                      {message.relevantSections.map((section, index) => (
                        <div key={index} className="text-xs bg-white bg-opacity-50 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{section.title}</span>
                            <span className={`section-badge ${getSectionTypeColor(section.type)}`}>
                              {section.type}
                            </span>
                          </div>
                          <p className="text-gray-600">{section.preview}</p>
                          {section.page_number && (
                            <p className="text-gray-500">Page {section.page_number}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streamingResponse && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 mr-2 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{streamingResponse}</p>
                <div className="mt-2">
                  <div className="animate-pulse text-xs text-gray-500">Typing...</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about this manual..."
          className="flex-1 input-field"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  )
}
