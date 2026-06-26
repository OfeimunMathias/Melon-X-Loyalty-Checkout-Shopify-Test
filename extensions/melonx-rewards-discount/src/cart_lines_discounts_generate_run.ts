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

  const pointsValue = input.cart.points?.value;
  const voucherCode = input.cart.voucherCode?.value;
  const discountAmountValue = input.cart.discountAmount?.value;

  if (!pointsValue || !voucherCode || !discountAmountValue) {
    return EMPTY_DISCOUNT;
  }

  const points = Number(pointsValue);
  const requestedDiscountAmount = Number(discountAmountValue);
  const subtotal = Number(input.cart.cost.subtotalAmount.amount);

  if (
    !Number.isFinite(points) ||
    points <= 0 ||
    !Number.isFinite(requestedDiscountAmount) ||
    requestedDiscountAmount <= 0 ||
    !Number.isFinite(subtotal) ||
    subtotal <= 0
  ) {
    return EMPTY_DISCOUNT;
  }

  const discountAmount = Math.min(requestedDiscountAmount, subtotal);

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
