import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'

interface TranscriptionPanelProps {
  encounterId: string
}

export function TranscriptionPanel({ encounterId }: TranscriptionPanelProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { updateEncounter, currentEncounter } = useEncounterStore()

  useEffect(() => {
    if (currentEncounter?.raw_transcript) {
      setTranscript(currentEncounter.raw_transcript)
    }
  }, [currentEncounter])

  const startRecording = async () => {
    try {
      setError('')
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // For now, we'll use a placeholder WebSocket URL
      // This will be replaced with actual Deepgram integration
      const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api.deepgram.com/v1/listen'
      
      // TODO: Connect to actual transcription WebSocket
      // For now, we'll simulate with local recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // TODO: Send audio to transcription API
        // For now, we'll just update the transcript placeholder
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        console.log('Audio recorded:', audioBlob.size, 'bytes')
        
        // Update encounter with transcript
        if (transcript) {
          await updateEncounter(encounterId, {
            raw_transcript: transcript,
          })
        }
      }

      mediaRecorder.start(1000) // Collect chunks every second
      setIsRecording(true)
    } catch (err: any) {
      setError(err.message || 'Failed to start recording')
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    setIsRecording(false)
  }

  const handleSaveTranscript = async () => {
    if (transcript && encounterId) {
      try {
        await updateEncounter(encounterId, {
          raw_transcript: transcript,
        })
        alert('Transcript saved successfully!')
      } catch (error: any) {
        setError(error.message)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Live Transcription</h2>
        <div className="flex gap-2">
          {transcript && (
            <button
              onClick={handleSaveTranscript}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
            >
              Save Transcript
            </button>
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcription will appear here... (Manual entry available until Deepgram integration is complete)"
          className="w-full min-h-[200px] max-h-[400px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
        <p className="text-xs text-gray-500 mt-2">
          Note: Real-time transcription via Deepgram will be available after API setup
        </p>
      </div>
    </div>
  )
}

