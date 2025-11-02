// src/app/api/v1/orders/route.ts
import { NextResponse } from 'next/server'
import { ordersService } from '@/infrastructure/services/orders.service'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const vendorId = searchParams.get('vendorId')
        const orderId = searchParams.get('orderId')
        const type = searchParams.get('type')

        let result

        if (orderId && type === 'details') {
            result = await ordersService.getOrderDetails(orderId)
        } else if (orderId && type === 'basic') {
            result = await ordersService.getOrderById(orderId)
        } else if (orderId && type === 'tracking') {
            result = await ordersService.getTracking(orderId)
        } else if (userId) {
            result = await ordersService.getUserOrders(Number(userId))
        } else if (vendorId) {
            result = await ordersService.getVendorOrders(vendorId)
        } else if (type === 'stats') {
            result = await ordersService.getOrderStats()
        } else {
            return NextResponse.json({ success: false, message: 'Unsupported query' }, { status: 400 })
        }

        return NextResponse.json(result ?? { success: false, message: 'No result' })
    } catch (err: any) {
        console.error('❌ [GET /api/v1/orders] error:', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}

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
        console.error('❌ [POST /api/v1/orders] error:', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}
