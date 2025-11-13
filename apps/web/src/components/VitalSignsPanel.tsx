import { useState, useEffect } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import { useEncounterStore } from '../stores/encounterStore'

interface VitalSignsPanelProps {
  encounterId: string
  initialVitals?: any
  onSave?: () => void
}

interface VitalValues {
  temperature?: { value: number; unit: 'F' | 'C'; timestamp?: string }
  blood_pressure?: { systolic: number; diastolic: number; timestamp?: string }
  heart_rate?: { value: number; unit: 'bpm'; timestamp?: string }
  respiratory_rate?: { value: number; unit: 'breaths/min'; timestamp?: string }
  oxygen_saturation?: { value: number; unit: '%'; timestamp?: string }
  weight?: { value: number; unit: 'lbs' | 'kg'; timestamp?: string }
  height?: { value: number; unit: 'in' | 'cm'; timestamp?: string }
  bmi?: { value: number; category: string; timestamp?: string }
}

export function VitalSignsPanel({ encounterId, initialVitals, onSave }: VitalSignsPanelProps) {
  const { updateEncounter } = useEncounterStore()
  const [vitals, setVitals] = useState<VitalValues>(initialVitals || {})
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialVitals) {
      setVitals(initialVitals)
    }
  }, [initialVitals])

  const calculateBMI = (weight: number, height: number, weightUnit: string, heightUnit: string) => {
    // Convert to metric if needed
    let weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight
    let heightM = heightUnit === 'in' ? height * 0.0254 : height / 100

    if (heightM === 0) return null

    const bmi = weightKg / (heightM * heightM)
    let category = ''
    if (bmi < 18.5) category = 'underweight'
    else if (bmi < 25) category = 'normal'
    else if (bmi < 30) category = 'overweight'
    else category = 'obese'

    return { value: parseFloat(bmi.toFixed(1)), category }
  }

  const updateVital = (key: keyof VitalValues, value: any) => {
    const updated = {
      ...vitals,
      [key]: {
        ...vitals[key],
        ...value,
        timestamp: new Date().toISOString(),
      },
    }

    // Auto-calculate BMI if weight and height are present
    if (key === 'weight' || key === 'height') {
      const weight = updated.weight?.value
      const height = updated.height?.value
      const weightUnit = updated.weight?.unit || 'lbs'
      const heightUnit = updated.height?.unit || 'in'

      if (weight && height) {
        const bmi = calculateBMI(weight, height, weightUnit, heightUnit)
        if (bmi) {
          updated.bmi = { ...bmi, timestamp: new Date().toISOString() }
        }
      }
    }

    setVitals(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateEncounter(encounterId, { vitals })
      setIsEditing(false)
      if (onSave) onSave()
    } catch (error: any) {
      alert(`Error saving vitals: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getNormalRange = (vital: string) => {
    const ranges: Record<string, { min: number; max: number; unit: string }> = {
      temperature: { min: 97.0, max: 99.5, unit: 'F' },
      heart_rate: { min: 60, max: 100, unit: 'bpm' },
      respiratory_rate: { min: 12, max: 20, unit: 'breaths/min' },
      oxygen_saturation: { min: 95, max: 100, unit: '%' },
      systolic: { min: 90, max: 120, unit: 'mmHg' },
      diastolic: { min: 60, max: 80, unit: 'mmHg' },
    }
    return ranges[vital]
  }

  const isAbnormal = (vital: string, value: number) => {
    const range = getNormalRange(vital)
    if (!range) return false
    return value < range.min || value > range.max
  }

  const hasVitals = Object.keys(vitals).length > 0 && Object.values(vitals).some(v => v !== null && v !== undefined)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Vital Signs</h2>
        {hasVitals && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing || !hasVitals ? (
        <div className="space-y-4">
          {/* Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature?.value || ''}
                  onChange={(e) => updateVital('temperature', {
                    value: parseFloat(e.target.value) || undefined,
                    unit: vitals.temperature?.unit || 'F',
                  })}
                  placeholder="98.6"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={vitals.temperature?.unit || 'F'}
                  onChange={(e) => updateVital('temperature', {
                    value: vitals.temperature?.value,
                    unit: e.target.value as 'F' | 'C',
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="F">°F</option>
                  <option value="C">°C</option>
                </select>
              </div>
            </div>

            {/* Blood Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={vitals.blood_pressure?.systolic || ''}
                  onChange={(e) => updateVital('blood_pressure', {
                    systolic: parseInt(e.target.value) || undefined,
                    diastolic: vitals.blood_pressure?.diastolic,
                  })}
                  placeholder="120"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-gray-500">/</span>
                <input
                  type="number"
                  value={vitals.blood_pressure?.diastolic || ''}
                  onChange={(e) => updateVital('blood_pressure', {
                    systolic: vitals.blood_pressure?.systolic,
                    diastolic: parseInt(e.target.value) || undefined,
                  })}
                  placeholder="80"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">mmHg</span>
              </div>
            </div>
          </div>

          {/* Heart Rate & Respiratory Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={vitals.heart_rate?.value || ''}
                  onChange={(e) => updateVital('heart_rate', {
                    value: parseInt(e.target.value) || undefined,
                    unit: 'bpm',
                  })}
                  placeholder="72"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500 self-center">bpm</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={vitals.respiratory_rate?.value || ''}
                  onChange={(e) => updateVital('respiratory_rate', {
                    value: parseInt(e.target.value) || undefined,
                    unit: 'breaths/min',
                  })}
                  placeholder="16"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500 self-center">/min</span>
              </div>
            </div>
          </div>

          {/* Oxygen Saturation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={vitals.oxygen_saturation?.value || ''}
                onChange={(e) => updateVital('oxygen_saturation', {
                  value: parseInt(e.target.value) || undefined,
                  unit: '%',
                })}
                placeholder="98"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500 self-center">%</span>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.weight?.value || ''}
                  onChange={(e) => updateVital('weight', {
                    value: parseFloat(e.target.value) || undefined,
                    unit: vitals.weight?.unit || 'lbs',
                  })}
                  placeholder="150"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={vitals.weight?.unit || 'lbs'}
                  onChange={(e) => updateVital('weight', {
                    value: vitals.weight?.value,
                    unit: e.target.value as 'lbs' | 'kg',
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.height?.value || ''}
                  onChange={(e) => updateVital('height', {
                    value: parseFloat(e.target.value) || undefined,
                    unit: vitals.height?.unit || 'in',
                  })}
                  placeholder="68"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={vitals.height?.unit || 'in'}
                  onChange={(e) => updateVital('height', {
                    value: vitals.height?.value,
                    unit: e.target.value as 'in' | 'cm',
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>
          </div>

          {/* BMI (calculated) */}
          {vitals.bmi && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BMI (calculated)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{vitals.bmi.value}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  vitals.bmi.category === 'normal' ? 'bg-green-100 text-green-800' :
                  vitals.bmi.category === 'underweight' ? 'bg-blue-100 text-blue-800' :
                  vitals.bmi.category === 'overweight' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {vitals.bmi.category}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setVitals(initialVitals || {})
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Vitals'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vitals.temperature && (
            <div className={`p-3 rounded-lg border ${isAbnormal('temperature', vitals.temperature.value) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600">Temperature</span>
                {isAbnormal('temperature', vitals.temperature.value) && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-lg font-semibold">
                {vitals.temperature.value}°{vitals.temperature.unit}
              </div>
            </div>
          )}

          {vitals.blood_pressure && (
            <div className={`p-3 rounded-lg border ${
              isAbnormal('systolic', vitals.blood_pressure.systolic) || isAbnormal('diastolic', vitals.blood_pressure.diastolic)
                ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600">Blood Pressure</span>
                {(isAbnormal('systolic', vitals.blood_pressure.systolic) || isAbnormal('diastolic', vitals.blood_pressure.diastolic)) && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-lg font-semibold">
                {vitals.blood_pressure.systolic}/{vitals.blood_pressure.diastolic}
              </div>
              <div className="text-xs text-gray-500">mmHg</div>
            </div>
          )}

          {vitals.heart_rate && (
            <div className={`p-3 rounded-lg border ${isAbnormal('heart_rate', vitals.heart_rate.value) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600">Heart Rate</span>
                {isAbnormal('heart_rate', vitals.heart_rate.value) && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-lg font-semibold">{vitals.heart_rate.value}</div>
              <div className="text-xs text-gray-500">bpm</div>
            </div>
          )}

          {vitals.respiratory_rate && (
            <div className={`p-3 rounded-lg border ${isAbnormal('respiratory_rate', vitals.respiratory_rate.value) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600">Respiratory Rate</span>
                {isAbnormal('respiratory_rate', vitals.respiratory_rate.value) && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-lg font-semibold">{vitals.respiratory_rate.value}</div>
              <div className="text-xs text-gray-500">/min</div>
            </div>
          )}

          {vitals.oxygen_saturation && (
            <div className={`p-3 rounded-lg border ${isAbnormal('oxygen_saturation', vitals.oxygen_saturation.value) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600">O2 Sat</span>
                {isAbnormal('oxygen_saturation', vitals.oxygen_saturation.value) && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-lg font-semibold">{vitals.oxygen_saturation.value}%</div>
            </div>
          )}

          {vitals.weight && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">Weight</div>
              <div className="text-lg font-semibold">{vitals.weight.value}</div>
              <div className="text-xs text-gray-500">{vitals.weight.unit}</div>
            </div>
          )}

          {vitals.height && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">Height</div>
              <div className="text-lg font-semibold">{vitals.height.value}</div>
              <div className="text-xs text-gray-500">{vitals.height.unit}</div>
            </div>
          )}

          {vitals.bmi && (
            <div className={`p-3 rounded-lg border ${
              vitals.bmi.category === 'normal' ? 'border-green-200 bg-green-50' :
              vitals.bmi.category === 'obese' ? 'border-red-300 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="text-xs text-gray-600 mb-1">BMI</div>
              <div className="text-lg font-semibold">{vitals.bmi.value}</div>
              <div className="text-xs capitalize">{vitals.bmi.category}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

