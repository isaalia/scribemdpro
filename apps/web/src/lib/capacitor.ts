import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform()

// App lifecycle
export const app = {
  getInfo: () => App.getInfo(),
  getLaunchUrl: () => App.getLaunchUrl(),
  addListener: (event: string, callback: (data: any) => void) => App.addListener(event as any, callback),
  removeAllListeners: () => App.removeAllListeners(),
}

// Keyboard
export const keyboard = {
  show: () => Keyboard.show(),
  hide: () => Keyboard.hide(),
  setAccessoryBarVisible: (isVisible: boolean) => Keyboard.setAccessoryBarVisible({ isVisible }),
  setScroll: (options: { disabled: boolean }) => Keyboard.setScroll(options),
  setStyle: (options: { style: 'dark' | 'light' }) => Keyboard.setStyle(options),
  setResize: (options: { mode: 'body' | 'ionic' | 'native' | 'none' }) => Keyboard.setResize(options),
  addListener: (event: string, callback: (data: any) => void) => Keyboard.addListener(event as any, callback),
}

// Haptics
export const haptics = {
  impact: (style: ImpactStyle = ImpactStyle.Medium) => Haptics.impact({ style }),
  notification: (type: 'success' | 'warning' | 'error') => {
    const style = type === 'success' ? 'SUCCESS' : type === 'warning' ? 'WARNING' : 'ERROR'
    Haptics.notification({ type: style as any })
  },
  vibrate: (duration?: number) => Haptics.vibrate({ duration }),
}

// Filesystem
export const filesystem = {
  readFile: (path: string, options?: { encoding?: Encoding; directory?: Directory }) =>
    Filesystem.readFile({ path, ...options }),
  writeFile: (path: string, data: string, options?: { encoding?: Encoding; directory?: Directory }) =>
    Filesystem.writeFile({ path, data, ...options }),
  deleteFile: (path: string, options?: { directory?: Directory }) =>
    Filesystem.deleteFile({ path, ...options }),
  mkdir: (path: string, options?: { recursive?: boolean; directory?: Directory }) =>
    Filesystem.mkdir({ path, ...options }),
  rmdir: (path: string, options?: { recursive?: boolean; directory?: Directory }) =>
    Filesystem.rmdir({ path, ...options }),
  stat: (path: string, options?: { directory?: Directory }) =>
    Filesystem.stat({ path, ...options }),
  readdir: (path: string, options?: { directory?: Directory }) =>
    Filesystem.readdir({ path, ...options }),
}

// Camera
export const camera = {
  getPhoto: (options?: {
    quality?: number
    allowEditing?: boolean
    resultType?: CameraResultType
    source?: CameraSource
  }) => Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    ...options,
  }),
}

