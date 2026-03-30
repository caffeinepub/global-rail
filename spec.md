# Global Rail

## Current State
- Full e-commerce app with product listing, cart, batch order rounds, admin dashboard
- Orders are placed but have no status tracking
- No My Orders section for users
- Paynow config is stored but not used for payment confirmation flow
- Backend has `getMyOrders()` but no order status field
- Frontend has no My Orders view

## Requested Changes (Diff)

### Add
- Order status enum: `#pendingPayment`, `#paymentConfirmed`, `#shipped`, `#delivered`, `#receivedByUser`
- Backend: `confirmOrderReceived(orderId)` - user marks order as received
- Backend: `updateOrderStatus(orderId, status)` - admin updates order status
- Backend: `getMyOrders()` - already exists, keep
- Frontend: "My Orders" nav tab (visible when logged in)
- Frontend: My Orders page listing user's orders with status badges, timestamps, item count, total, and a "Confirm Receipt" button when status is `#delivered`
- Frontend: Admin Orders view shows all orders with ability to update status via dropdown

### Modify
- `OrderData` type: add `status` field
- `placeOrder`: sets initial status to `#pendingPayment`
- Order status in admin orders table: show current status and allow changing it
- `useQueries.ts`: add `useMyOrders`, `useConfirmOrderReceived`, `useUpdateOrderStatus` hooks
- Nav bar: add "My Orders" link when user is logged in
- Cart checkout: after placing order, prompt user to go to My Orders

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo`:
   - Add `OrderStatus` variant type
   - Add `status` to `OrderData`
   - Update `placeOrder` to set `status = #pendingPayment`
   - Add `updateOrderStatus(orderId, status)` admin-only function
   - Add `confirmOrderReceived(orderId)` user function (only if status is `#delivered`)
2. Update frontend `useQueries.ts`:
   - Add `useMyOrders` hook calling `actor.getMyOrders()`
   - Add `useConfirmOrderReceived` mutation
   - Add `useUpdateOrderStatus` mutation (admin)
   - Invalidate `myOrders` and `allOrders` on mutations
3. Update `App.tsx`:
   - Add `myorders` to View type
   - Add My Orders nav link (visible when logged in)
   - Add My Orders page component showing user's orders with status badges
   - Add "Confirm Receipt" button on delivered orders
   - Admin panel: show all orders with status dropdown to update
   - After checkout success, toast with link to My Orders
