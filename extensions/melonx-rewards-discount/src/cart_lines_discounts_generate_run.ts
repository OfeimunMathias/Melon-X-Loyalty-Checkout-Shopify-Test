import type {CartInput} from '../generated/api';
import {
  CartLinesDiscountsGenerateRunResult,
  DiscountClass,
  OrderDiscountSelectionStrategy,
} from '../generated/api';

const EMPTY_DISCOUNT: CartLinesDiscountsGenerateRunResult = {
  operations: [],
};

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );

  if (!hasOrderDiscountClass) {
    return EMPTY_DISCOUNT;
  }

  const pointsValue = input.cart.attribute?.value;

  if (!pointsValue) {
    return EMPTY_DISCOUNT;
  }

  const points = Number(pointsValue);

  if (!Number.isFinite(points) || points <= 0) {
    return EMPTY_DISCOUNT;
  }

  const subtotal = Number(input.cart.cost.subtotalAmount.amount);

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return EMPTY_DISCOUNT;
  }

  // 1 point = ₦1
  const discountAmount = Math.min(points, subtotal);

  return {
    operations: [
      {
        orderDiscountsAdd: {
          candidates: [
            {
              message: 'Melon X Rewards',
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value: {
                fixedAmount: {
                  amount: discountAmount.toFixed(2),
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
