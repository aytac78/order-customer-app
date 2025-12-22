export interface Reservation {
  id: string
  venue: string
  emoji: string
  date: string
  time: string
  guests: number
  table: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  confirmCode: string
  deposit: number
  phone?: string
  specialRequests?: string
  createdAt: string
}

export const getReservations = (): { active: Reservation[]; past: Reservation[] } => {
  if (typeof window === 'undefined') return { active: [], past: [] }
  const stored = localStorage.getItem('order_reservations')
  if (stored) return JSON.parse(stored)
  return { active: [], past: [] }
}

export const addReservation = (reservation: Omit<Reservation, 'id' | 'confirmCode' | 'createdAt'>): Reservation => {
  const data = getReservations()
  const newRes: Reservation = {
    ...reservation,
    id: `res-${Date.now()}`,
    confirmCode: `ORD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString()
  }
  data.active.unshift(newRes)
  localStorage.setItem('order_reservations', JSON.stringify(data))
  return newRes
}

export const cancelReservation = (id: string) => {
  const data = getReservations()
  const index = data.active.findIndex(r => r.id === id)
  if (index !== -1) {
    const cancelled = { ...data.active[index], status: 'cancelled' as const }
    data.active.splice(index, 1)
    data.past.unshift(cancelled)
    localStorage.setItem('order_reservations', JSON.stringify(data))
  }
}
// Favoriler
export const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('order_favorites')
  return stored ? JSON.parse(stored) : []
}

export const toggleFavorite = (placeId: string, placeName: string, placeEmoji: string, placeCategory: string): boolean => {
  const favorites = getFavorites()
  const index = favorites.indexOf(placeId)
  
  if (index === -1) {
    favorites.push(placeId)
    // Detayları da sakla
    const details = getFavoriteDetails()
    details[placeId] = { name: placeName, emoji: placeEmoji, category: placeCategory }
    localStorage.setItem('order_favorite_details', JSON.stringify(details))
  } else {
    favorites.splice(index, 1)
  }
  
  localStorage.setItem('order_favorites', JSON.stringify(favorites))
  return index === -1
}

export const isFavorite = (placeId: string): boolean => {
  return getFavorites().includes(placeId)
}

export const getFavoriteDetails = (): Record<string, { name: string; emoji: string; category: string }> => {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem('order_favorite_details')
  return stored ? JSON.parse(stored) : {}
}