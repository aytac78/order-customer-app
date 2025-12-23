'use client'

import { CoffeestarProvider } from '@/lib/coffeestar-context'
import { useAuth } from '@/lib/AuthContext'

export default function CoffeestarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  
  return (
    <CoffeestarProvider userId={user?.id}>
      {children}
    </CoffeestarProvider>
  )
}
