import { getAllStorageKeys, getRawStorage, setRawStorage, removeStorage } from './useStorage'
import { useToast } from './useToast'

export interface ExportedSettings {
  version: string
  exportDate: string
  data: Record<string, string>
}

const { success, error: errorToast } = useToast()

/**
 * Exports all localStorage settings as a JSON file
 */
export function exportSettings(): void {
  const keys = getAllStorageKeys()
  const data: Record<string, string> = {}

  keys.forEach((key) => {
    const value = getRawStorage(key)
    if (value !== null) {
      data[key] = value
    }
  })

  const exported: ExportedSettings = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data,
  }

  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `idlemmo-settings-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  success('Settings exported successfully')
}

/**
 * Imports settings from a JSON file
 * @param file - File object to import
 * @returns Promise that resolves when import is complete
 */
export function importSettings(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const imported = JSON.parse(content) as ExportedSettings

        if (!imported.data || typeof imported.data !== 'object') {
          throw new Error('Invalid settings file format')
        }

        // Import all settings
        Object.entries(imported.data).forEach(([key, value]) => {
          setRawStorage(key, value)
        })

        success('Settings imported successfully! Refreshing page...', 2000)
        // Refresh page to apply new settings
        setTimeout(() => window.location.reload(), 2000)
        resolve()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errorToast(`Failed to import settings: ${message}`, 5000)
        reject(error)
      }
    }

    reader.onerror = () => {
      errorToast('Failed to read file', 5000)
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Resets all settings to defaults except API key
 */
export function resetToDefaults(): void {
  if (
    !confirm(
      'This will reset all settings to defaults (except your API key). Are you sure?'
    )
  ) {
    return
  }

  const keys = getAllStorageKeys()

  // Remove all keys except apiKey
  keys.forEach((key) => {
    if (key !== 'apiKey') {
      removeStorage(key)
    }
  })

  // Explicitly clear data provider overrides (belt-and-suspenders)
  removeStorage('user-overrides')

  success('Settings reset to defaults! Refreshing page...', 2000)
  setTimeout(() => window.location.reload(), 2000)
}

/**
 * Resets ALL settings including API key
 */
export function resetAll(): void {
  if (
    !confirm(
      'This will reset ALL settings including your API key. Are you sure?'
    )
  ) {
    return
  }

  const keys = getAllStorageKeys()
  keys.forEach((key) => removeStorage(key))

  // Explicitly clear data provider overrides (belt-and-suspenders)
  removeStorage('user-overrides')

  success('All settings cleared! Refreshing page...', 2000)
  setTimeout(() => window.location.reload(), 2000)
}
