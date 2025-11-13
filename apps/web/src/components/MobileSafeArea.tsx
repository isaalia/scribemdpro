import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SafeArea } from 'capacitor-plugin-safe-area'

interface MobileSafeAreaProps {
  children: React.ReactNode
}

export function MobileSafeArea({ children }: MobileSafeAreaProps) {
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SafeArea.getSafeAreaInsets().then((insets) => {
        setSafeAreaInsets(insets)
      })
    }
  }, [])

  if (!Capacitor.isNativePlatform()) {
    return <>{children}</>
  }

  return (
    <div
      style={{
        paddingTop: `${safeAreaInsets.top}px`,
        paddingBottom: `${safeAreaInsets.bottom}px`,
        paddingLeft: `${safeAreaInsets.left}px`,
        paddingRight: `${safeAreaInsets.right}px`,
      }}
    >
      {children}
    </div>
  )
}

