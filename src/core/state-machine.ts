/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrderStatus, PaymentStatus, UserRole } from '../types/index.ts';

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates order transitions against allowed business rules and roles.
 */
export function canTransitionOrder(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  role: UserRole,
  paymentStatus: PaymentStatus
): TransitionResult {
  // Terminal states cannot transition
  if (fromStatus === 'CANCELLED') {
    return { allowed: false, reason: 'Cancelled orders cannot change status.' };
  }
  if (fromStatus === 'COMPLETED') {
    return { allowed: false, reason: 'Completed orders are finalized and cannot be modified.' };
  }

  // Idempotent check
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  // Cancellation rules
  if (toStatus === 'CANCELLED') {
    if (fromStatus === 'READY' || fromStatus === 'SERVED') {
      // High-waste states require manager or owner override
      if (role !== 'MANAGER' && role !== 'OWNER') {
        return {
          allowed: false,
          reason: 'Manager or Owner authorization is required to cancel orders that are already cooked or served.',
        };
      }
    }
    return { allowed: true };
  }

  // Completion rule: MUST be paid before completion
  if (toStatus === 'COMPLETED') {
    if (fromStatus !== 'SERVED') {
      return { allowed: false, reason: 'Orders must be served before being marked completed.' };
    }
    if (paymentStatus !== 'PAID') {
      return {
        allowed: false,
        reason: 'Cannot complete order: Payment has not been confirmed or settled.',
      };
    }
    if (role !== 'CASHIER' && role !== 'MANAGER' && role !== 'OWNER') {
      return { allowed: false, reason: 'Only cashier, manager, or owner can complete orders.' };
    }
    return { allowed: true };
  }

  // Progressive flow rules
  switch (fromStatus) {
    case 'RECEIVED':
      if (toStatus === 'ACCEPTED') {
        if (role === 'PUBLIC_DINER') {
          return { allowed: false, reason: 'Diners cannot accept their own orders.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Invalid transition from RECEIVED to ${toStatus}. Must be ACCEPTED or CANCELLED.`,
      };

    case 'ACCEPTED':
      if (toStatus === 'PREPARING') {
        if (role === 'PUBLIC_DINER' || role === 'CASHIER') {
          return { allowed: false, reason: 'Only kitchen, manager, or owner can start food prep.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Invalid transition from ACCEPTED to ${toStatus}. Must be PREPARING or CANCELLED.`,
      };

    case 'PREPARING':
      if (toStatus === 'READY') {
        if (role === 'PUBLIC_DINER' || role === 'CASHIER') {
          return { allowed: false, reason: 'Only kitchen, manager, or owner can bump orders to READY.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Invalid transition from PREPARING to ${toStatus}. Must be READY or CANCELLED.`,
      };

    case 'READY':
      if (toStatus === 'SERVED') {
        if (role === 'PUBLIC_DINER') {
          return { allowed: false, reason: 'Diners cannot mark orders as served.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Invalid transition from READY to ${toStatus}. Must be SERVED or CANCELLED.`,
      };

    case 'SERVED':
      // The only transition forward from SERVED is COMPLETED (checked above)
      return {
        allowed: false,
        reason: `Orders in SERVED state can only transition to COMPLETED once paid.`,
      };

    default:
      return { allowed: false, reason: 'Unknown order status state.' };
  }
}
