import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

interface MobileSafeAreaProps {
  children: React.ReactNode
}

export function MobileSafeArea({ children }: MobileSafeAreaProps) {
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Use CSS safe-area-inset variables which Capacitor provides automatically
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
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

