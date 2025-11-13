import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTemplateStore, type Template } from '../stores/templateStore'
import { ArrowLeft, Save } from 'lucide-react'
import { Navigation } from '../components/Navigation'

export default function TemplateFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { currentTemplate, loading, fetchTemplate, createTemplate, updateTemplate } = useTemplateStore()

  const [formData, setFormData] = useState({
    name: '',
    type: 'soap' as Template['type'],
    is_default: false,
    is_active: true,
    content: {
      sections: [] as Array<{
        id: string
        name: string
        fields: Array<{
          id: string
          label: string
          type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number'
          placeholder?: string
          options?: string[]
          required?: boolean
        }>
      }>,
    },
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchTemplate(id)
    }
  }, [isEdit, id, fetchTemplate])

  useEffect(() => {
    if (isEdit && currentTemplate) {
      setFormData({
        name: currentTemplate.name,
        type: currentTemplate.type,
        is_default: currentTemplate.is_default,
        is_active: currentTemplate.is_active,
        content: currentTemplate.content || { sections: [] },
      })
    }
  }, [isEdit, currentTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit && id) {
        await updateTemplate(id, formData)
      } else {
        await createTemplate(formData)
      }
      navigate('/templates')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const addSection = () => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        sections: [
          ...formData.content.sections,
          {
            id: `section-${Date.now()}`,
            name: '',
            fields: [],
          },
        ],
      },
    })
  }

  const updateSection = (sectionId: string, updates: Partial<{ name: string; fields: any[] }>) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        sections: formData.content.sections.map((s) =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      },
    })
  }

  const deleteSection = (sectionId: string) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        sections: formData.content.sections.filter((s) => s.id !== sectionId),
      },
    })
  }

  const addField = (sectionId: string) => {
    updateSection(sectionId, {
      fields: [
        ...(formData.content.sections.find((s) => s.id === sectionId)?.fields || []),
        {
          id: `field-${Date.now()}`,
          label: '',
          type: 'text' as const,
          required: false,
        },
      ],
    })
  }

  const updateField = (sectionId: string, fieldId: string, updates: any) => {
    const section = formData.content.sections.find((s) => s.id === sectionId)
    if (!section) return

    updateSection(sectionId, {
      fields: section.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    })
  }

  const deleteField = (sectionId: string, fieldId: string) => {
    const section = formData.content.sections.find((s) => s.id === sectionId)
    if (!section) return

    updateSection(sectionId, {
      fields: section.fields.filter((f) => f.id !== fieldId),
    })
  }

  if (loading && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-gray-500">Loading template...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Templates
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Template' : 'Create Template'}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Standard SOAP Note"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Template['type'] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="soap">SOAP</option>
                  <option value="hpi">HPI</option>
                  <option value="ros">ROS</option>
                  <option value="exam">Physical Exam</option>
                  <option value="plan">Plan</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Template Sections
                </label>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Add Section
                </button>
              </div>

              <div className="space-y-4">
                {formData.content.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        placeholder="Section name"
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => deleteSection(section.id)}
                        className="ml-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-2">
                      {section.fields.map((field) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                            placeholder="Field label"
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(section.id, field.id, { type: e.target.value })}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="number">Number</option>
                          </select>
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                            className="mt-1"
                          />
                          <button
                            type="button"
                            onClick={() => deleteField(section.id, field.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addField(section.id)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        + Add Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Save className="w-5 h-5" />
                {isEdit ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

