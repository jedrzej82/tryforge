'use client'

import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Add your providers here (e.g., Theme, Auth, Query Client, etc.)
  // Example:
  // return (
  //   <ThemeProvider>
  //     <AuthProvider>
  //       {children}
  //     </AuthProvider>
  //   </ThemeProvider>
  // )

  return <>{children}</>
}
