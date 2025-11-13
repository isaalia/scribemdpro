import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplateStore } from '../stores/templateStore'
import { Plus, Edit, Trash2, FileText, Star } from 'lucide-react'
import { Navigation } from '../components/Navigation'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { templates, loading, fetchTemplates, deleteTemplate } = useTemplateStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      setDeletingId(id)
      try {
        await deleteTemplate(id)
      } catch (error: any) {
        alert(`Error: ${error.message}`)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      soap: 'bg-blue-100 text-blue-800',
      hpi: 'bg-green-100 text-green-800',
      ros: 'bg-purple-100 text-purple-800',
      exam: 'bg-yellow-100 text-yellow-800',
      plan: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors.custom
  }

  if (loading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">Loading templates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-2">Manage your encounter note templates</p>
          </div>
          <button
            onClick={() => navigate('/templates/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-6">Create your first template to speed up documentation</p>
            <button
              onClick={() => navigate('/templates/new')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(template.type)}`}>
                      {template.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>Used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

