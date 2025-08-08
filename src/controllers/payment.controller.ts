import axios from "axios";
import prisma from "../config/prisma";
import { RequestHandler } from "express";
import paymentService from "../services/payment.service";
import orderService from "../services/order.service";
import { AuthenticationError, NotFoundError } from "../types/error";
import orderRepository from "../repositories/order.repository";
import cartRepository from "../repositories/cart.repository";

type TConfirmPaymentBodyDto = {
  paymentKey: string;
  orderId: string;
  amount: string;
};

const confirmPayment: RequestHandler<{}, {}, TConfirmPaymentBodyDto> = async (req, res, next) => {
  const { paymentKey, orderId, amount } = req.body;
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const { name: approver, companyId } = user;

  // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용 X
  // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가
  const widgetSecretKey = process.env.SECRET_KEY!;
  const encryptedSecretKey = "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

  try {
    // 결제 승인 시 결제수단에서 금액 차감
    const response = await axios.post(
      "https://api.tosspayments.com/v1/payments/confirm",
      { orderId, amount, paymentKey },
      {
        headers: {
          Authorization: encryptedSecretKey,
          "Content-Type": "application/json",
        },
      },
    );

    await prisma.$transaction(async (tx) => {
      const { orderName, method, requestedAt, approvedAt, totalAmount, suppliedAmount, vat } = response.data;
      // 1. 결제 조회, 결제 취소에 사용될 paymentKey, orderId 저장
      await paymentService.createPayment(
        { orderId, paymentKey, orderName, method, requestedAt, approvedAt, totalAmount, suppliedAmount, vat },
        tx,
      );

      // 2. Order 상태 업데이트 및 예산 차감
      await orderService.updateOrder(orderId, companyId, { approver, adminMessage: "즉시 구매", status: "APPROVED" });
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    const userId = user.id;
    const order = await orderRepository.getOrderWithCartItemIdsById(orderId);

    if (!order) throw new NotFoundError("주문 정보를 찾을 수 없습니다.");

    // cartItem 복구하기 위한 productIds 추출
    const productIds = order.receipts.map((receipt) => receipt.productId);

    await prisma.$transaction(async (tx) => {
      // 1. CartItem 복구
      await cartRepository.revertCartItem(userId, productIds, tx);

      // 2. Receipt + Order 삭제
      await orderRepository.deleteReceiptAndOrder(orderId, tx);
    });

    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: "결제 실패" });
    }
  }
};

export default {
  confirmPayment,
};
