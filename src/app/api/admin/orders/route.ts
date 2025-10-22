// src/app/api/v1/orders/route.ts
import { NextResponse } from 'next/server'
import { ordersService } from '@/infrastructure/services/orders.service'

/**
 * GET /api/v1/orders
 * Supports filtering by query params:
 * - userId
 * - vendorId
 * - orderId
 * - searchType ("tracking", "history", "stats", etc.)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const vendorId = searchParams.get('vendorId')
        const orderId = searchParams.get('orderId')
        const searchType = searchParams.get('type')

        let result

        // 1️⃣ Fetch order by ID
        if (orderId && searchType === 'details') {
            result = await ordersService.getOrderDetails(orderId)
            return NextResponse.json(result)
        }

        if (orderId && searchType === 'basic') {
            result = await ordersService.getOrderById(orderId)
            return NextResponse.json(result)
        }

        // 2️⃣ Fetch user or vendor orders
        if (userId) {
            result = await ordersService.getUserOrders(Number(userId))
            return NextResponse.json(result)
        }

        if (vendorId) {
            result = await ordersService.getVendorOrders(vendorId)
            return NextResponse.json(result)
        }

        // 3️⃣ Fetch global stats
        if (searchType === 'stats') {
            result = await ordersService.getOrderStats()
            return NextResponse.json(result)
        }

        // 4️⃣ Tracking
        if (orderId && searchType === 'tracking') {
            result = await ordersService.getTracking(orderId)
            return NextResponse.json(result)
        }

        return NextResponse.json({ success: false, message: 'Unsupported query' }, { status: 400 })
    } catch (err: any) {
        console.error('Error in GET /api/v1/orders:', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}

/**
 * POST /api/v1/orders
 * Handles dynamic workflow actions
 */
export async function POST(req: Request) {
    try {
        const { action, ...body } = await req.json()

        let result
        switch (action) {
            case 'create':
                result = await ordersService.createOrder(body)
                break

            case 'cancel':
                result = await ordersService.cancelOrder(body.orderId, body)
                break

            case 'assign-delivery':
                result = await ordersService.assignDelivery(body.orderId, body)
                break

            case 'confirm-pickup':
                result = await ordersService.confirmPickup(body.orderId, body.deliveryPersonId)
                break

            case 'start-delivery':
                result = await ordersService.startDelivery(body.orderId, body.deliveryPersonId)
                break

            case 'complete':
                result = await ordersService.completeOrder(body.orderId, body.userId, body)
                break

            case 'confirm-receipt':
                result = await ordersService.userConfirmReceipt(body.orderId, body.userId)
                break

            case 'validate-checkout':
                result = await ordersService.validateCheckout(body.userId, body)
                break

            default:
                return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (err: any) {
        console.error('Error in POST /api/v1/orders:', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}
