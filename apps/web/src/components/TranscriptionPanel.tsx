import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'
import { createClient } from '@deepgram/sdk'

interface TranscriptionPanelProps {
  encounterId: string
}

export function TranscriptionPanel({ encounterId }: TranscriptionPanelProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const deepgramConnectionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const { updateEncounter, currentEncounter } = useEncounterStore()

  useEffect(() => {
    if (currentEncounter?.raw_transcript) {
      setTranscript(currentEncounter.raw_transcript)
    }
  }, [currentEncounter])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (deepgramConnectionRef.current) {
        deepgramConnectionRef.current.finish()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError('')
      setIsConnecting(true)

      // Step 1: Get Deepgram token from our API
      const tokenResponse = await fetch('/api/transcribe/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get transcription token')
      }

      const { token } = await tokenResponse.json()
      if (!token) {
        throw new Error('No token received from server')
      }

      // Step 2: Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      mediaStreamRef.current = stream

      // Step 3: Create Deepgram connection
      const deepgram = createClient(token)
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        interim_results: true,
        endpointing: 300,
      })

      deepgramConnectionRef.current = connection

      // Step 4: Handle transcription results
      connection.on('open', () => {
        console.log('Deepgram connection opened')
        setIsConnecting(false)
        setIsRecording(true)
      })

      connection.on('Results', (data: any) => {
        const transcriptText = data.channel?.alternatives?.[0]?.transcript
        if (transcriptText) {
          if (data.is_final) {
            // Final result - append to transcript
            setTranscript(prev => {
              const updated = prev ? `${prev} ${transcriptText}` : transcriptText
              return updated.trim()
            })
          } else {
            // Interim result - show temporarily (optional: can display separately)
            // For now, we'll just append interim results too
          }
        }
      })

      connection.on('error', (error: any) => {
        console.error('Deepgram error:', error)
        setError(`Transcription error: ${error.message || 'Unknown error'}`)
        stopRecording()
      })

      connection.on('close', () => {
        console.log('Deepgram connection closed')
        setIsRecording(false)
      })

      // Step 5: Send audio to Deepgram
      // Deepgram's live API expects raw PCM audio (Int16Array)
      // We'll use Web Audio API to convert the stream to PCM format
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      })
      const source = audioContext.createMediaStreamSource(stream)
      
      // Use AudioWorkletNode if available, otherwise fall back to ScriptProcessorNode
      let processor: ScriptProcessorNode | AudioWorkletNode
      
      if (audioContext.audioWorklet) {
        // Modern approach: AudioWorklet (more efficient)
        try {
          // Note: In production, you'd load an AudioWorklet processor module
          // For now, fall back to ScriptProcessorNode
          processor = audioContext.createScriptProcessor(4096, 1, 1)
        } catch (e) {
          processor = audioContext.createScriptProcessor(4096, 1, 1)
        }
      } else {
        // Fallback: ScriptProcessorNode (deprecated but widely supported)
        processor = audioContext.createScriptProcessor(4096, 1, 1)
      }

      if ('onaudioprocess' in processor) {
        (processor as ScriptProcessorNode).onaudioprocess = (event) => {
          if (connection.getReadyState() !== 1) return
          
          const inputData = event.inputBuffer.getChannelData(0)
          // Convert Float32Array (-1 to 1) to Int16Array (-32768 to 32767)
          const int16Data = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }
          
          // Send PCM audio data to Deepgram
          connection.send(int16Data.buffer)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      // Store references for cleanup
      ;(connection as any)._audioContext = audioContext
      ;(connection as any)._processor = processor
      ;(connection as any)._source = source
    } catch (err: any) {
      setError(err.message || 'Failed to start recording')
      console.error('Recording error:', err)
      setIsConnecting(false)
      setIsRecording(false)
      
      // Cleanup on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
    }
  }

  const stopRecording = async () => {
    try {
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      // Close Deepgram connection
      if (deepgramConnectionRef.current) {
        const connection = deepgramConnectionRef.current
        const audioContext = (connection as any)._audioContext
        const processor = (connection as any)._processor
        const source = (connection as any)._source
        
        // Disconnect audio nodes
        if (processor) {
          processor.disconnect()
        }
        if (source) {
          source.disconnect()
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close()
        }
        
        connection.finish()
        deepgramConnectionRef.current = null
      }

      setIsRecording(false)
      setIsConnecting(false)

      // Auto-save transcript when stopping
      if (transcript && encounterId) {
        await updateEncounter(encounterId, {
          raw_transcript: transcript,
        })
      }
    } catch (err: any) {
      console.error('Stop recording error:', err)
      setError(err.message || 'Error stopping recording')
    }
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
            disabled={isConnecting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                {isConnecting ? 'Connecting...' : 'Start Recording'}
              </>
            )}
          </button>
        </div>
      </div>

      {(isRecording || isConnecting) && (
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">
            {isConnecting ? 'Connecting...' : 'Recording...'}
          </span>
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
          Real-time transcription powered by Deepgram. Click "Start Recording" to begin.
        </p>
      </div>
    </div>
  )
}

