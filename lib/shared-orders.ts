import { supabase } from './supabase'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  note?: string
  status?: 'pending' | 'preparing' | 'ready'
}

export interface Order {
  id?: string
  venue_id?: string
  venue_name: string
  table_number: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  customer_name?: string
  customer_phone?: string
  created_at?: string
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order & { id: string }> {
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      venue_id: order.venue_id,
      venue_name: order.venue_name,
      order_number: orderNumber,
      table_number: order.table_number,
      items: order.items.map((item, idx) => ({
        ...item,
        id: item.id || `item-${idx + 1}`,
        status: 'pending'
      })),
      subtotal: order.total,
      tax: Math.round(order.total * 0.08),
      total: Math.round(order.total * 1.08),
      status: order.status || 'pending',
      payment_status: 'pending',
      type: 'dine_in',
      customer_name: order.customer_name,
      customer_phone: order.customer_phone
    })
    .select()
    .single()

  if (error) {
    console.error('Create order error:', error)
    throw error
  }
  
  return { ...data, id: data.id }
}

export async function getMyOrders(customerId?: string): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data, error } = await query

  if (error) {
    console.error('Get orders error:', error)
    return []
  }
  return data || []
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Get order error:', error)
    return null
  }
  return data
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    console.error('Update order error:', error)
    return false
  }
  return true
}
