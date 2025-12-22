import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { LocationProvider } from '@/lib/LocationContext'
import { NotificationProvider } from '@/components/NotificationProvider'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/ThemeContext'
import { CartProvider } from '@/lib/CartContext'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ORDER - Kesfet & Siparis Ver',
  description: 'Restoran kesfi ve siparis uygulamasi',
  manifest: '/manifest.json',
  themeColor: '#f97316',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ORDER',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <LocationProvider>
                <CartProvider>
                  <NotificationProvider>
                    <main className="pb-20">
                      {children}
                    </main>
                    <BottomNav />
                  </NotificationProvider>
                </CartProvider>
              </LocationProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
