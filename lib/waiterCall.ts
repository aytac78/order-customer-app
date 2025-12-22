import { supabase } from './supabase'

export async function callWaiter(
  venueId: string, 
  tableNumber: string, 
  callType: 'waiter' | 'bill' | 'help',
  userId?: string,
  anonymousId?: string
) {
  const { data, error } = await supabase
    .from('waiter_calls')
    .insert({
      venue_id: venueId,
      table_number: tableNumber,
      customer_id: userId,
      anonymous_id: anonymousId,
      call_type: callType,
      status: 'pending'
    })
    .select()
    .single()

  return { data, error }
}

export async function startConversation(
  venueId: string,
  customerId: string,
  anonymousId: string,
  initialMessage?: string
) {
  let { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('venue_id', venueId)
    .eq('customer_id', customerId)
    .single()

  let conversationId = existing?.id

  if (!conversationId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        venue_id: venueId,
        customer_id: customerId,
        customer_anonymous_id: anonymousId,
        last_message: initialMessage || 'Yeni konuşma',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()
    
    conversationId = newConv?.id
  }

  if (initialMessage && conversationId) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      sender_id: customerId,
      venue_id: venueId,
      customer_id: customerId,
      content: initialMessage
    })
  }

  return conversationId
}
