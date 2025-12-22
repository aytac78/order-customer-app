import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const ORDERS_FILE = path.join(process.env.HOME || '', 'Downloads/shared-data/orders.json')

async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeOrders(orders: any[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2))
}

export async function OPTIONS() {
  return new Response(null, { headers })
}

export async function GET() {
  const orders = await readOrders()
  return NextResponse.json(orders, { headers })
}

export async function POST(req: NextRequest) {
  const order = await req.json()
  const orders = await readOrders()
  orders.push(order)
  await writeOrders(orders)
  return NextResponse.json(order, { headers })
}

export async function PUT(req: NextRequest) {
  const { id, status } = await req.json()
  const orders = await readOrders()
  const index = orders.findIndex((o: any) => o.id === id)
  if (index !== -1) {
    orders[index].status = status
    orders[index].updatedAt = new Date().toISOString()
    await writeOrders(orders)
    return NextResponse.json(orders[index], { headers })
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
}
