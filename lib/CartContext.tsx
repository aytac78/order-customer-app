'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  options?: { name: string; choice: string; price: number }[]
  notes?: string
}

interface CartContextType {
  items: CartItem[]
  venueId: string | null
  venueName: string | null
  addItem: (item: CartItem, venueId: string, venueName: string) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  cartCount: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueName, setVenueName] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // LocalStorage'dan yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem('order_cart')
      if (saved) {
        const data = JSON.parse(saved)
        setItems(data.items || [])
        setVenueId(data.venueId || null)
        setVenueName(data.venueName || null)
      }
    } catch (e) {
      console.error('Cart load error:', e)
    }
    setIsLoaded(true)
  }, [])

  // LocalStorage'a kaydet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('order_cart', JSON.stringify({ items, venueId, venueName }))
    }
  }, [items, venueId, venueName, isLoaded])

  const addItem = (item: CartItem, newVenueId: string, newVenueName: string) => {
    // Farklı mekandan ürün eklenirse sepeti temizle
    if (venueId && venueId !== newVenueId) {
      setItems([{ ...item, quantity: item.quantity || 1 }])
      setVenueId(newVenueId)
      setVenueName(newVenueName)
      return
    }

    setVenueId(newVenueId)
    setVenueName(newVenueName)

    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id)
      if (newItems.length === 0) {
        setVenueId(null)
        setVenueName(null)
      }
      return newItems
    })
  }

  const clearCart = () => {
    setItems([])
    setVenueId(null)
    setVenueName(null)
    localStorage.removeItem('order_cart')
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{
      items,
      venueId,
      venueName,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      cartCount,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}
