import { useState, useRef } from 'react'
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEncounterStore } from '../stores/encounterStore'

interface FileUploadPanelProps {
  encounterId: string
  initialFiles?: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
    uploaded_at: string
  }>
  onFilesChange?: () => void
}

export function FileUploadPanel({ encounterId, initialFiles = [], onFilesChange }: FileUploadPanelProps) {
  const { updateEncounter } = useEncounterStore()
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)

    try {
      // Get user's practice_id for storage path
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('practice_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const uploadedFiles = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileId = `${Date.now()}-${i}-${file.name}`
        const filePath = `${userData.practice_id}/encounters/${encounterId}/${fileId}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('patient-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('patient-files')
          .getPublicUrl(filePath)

        const fileRecord = {
          id: fileId,
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        }

        uploadedFiles.push(fileRecord)
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))
      }

      // Update encounter with new files
      const updatedFiles = [...files, ...uploadedFiles]
      await updateEncounter(encounterId, {
        files: updatedFiles,
      })

      setFiles(updatedFiles)
      if (onFilesChange) onFilesChange()
    } catch (error: any) {
      alert(`Error uploading files: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return

    try {
      // Get user's practice_id for storage path
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('practice_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const filePath = `${userData.practice_id}/encounters/${encounterId}/${fileId}`

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('patient-files')
        .remove([filePath])

      if (deleteError) {
        console.error('Delete error:', deleteError)
        // Continue even if storage delete fails - we'll still remove from DB
      }

      // Update encounter - remove file from list
      const updatedFiles = files.filter((f) => f.id !== fileId)
      await updateEncounter(encounterId, {
        files: updatedFiles,
      })

      setFiles(updatedFiles)
      if (onFilesChange) onFilesChange()
    } catch (error: any) {
      alert(`Error deleting file: ${error.message}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    return '📎'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
        <label className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Files
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx"
          />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No files attached</p>
          <p className="text-sm mt-2">Upload lab results, imaging, or other documents</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{file.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                  <div className="text-sm text-gray-500">
                    {uploadProgress[file.id]}%
                  </div>
                )}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.name)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT, CSV, XLS, XLSX (Max 10MB per file)
      </p>
    </div>
  )
}

