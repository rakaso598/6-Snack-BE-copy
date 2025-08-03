import axios from "axios";
import prisma from "../config/prisma";
import { RequestHandler } from "express";
import paymentService from "../services/payment.service";

type TConfirmPaymentBodyDto = {
  paymentKey: string;
  orderId: string;
  amount: string;
};

const confirmPayment: RequestHandler<{}, {}, TConfirmPaymentBodyDto> = async (req, res, next) => {
  // 클라이언트에서 받은 JSON 요청 바디입니다.
  const { paymentKey, orderId, amount } = req.body;

  // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용하지 않습니다.
  // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가합니다.
  const widgetSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
  const encryptedSecretKey = "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

  try {
    // 결제를 승인하면 결제수단에서 금액이 차감돼요.
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
      // 결제 조회, 결제 취소에 사용될 paymentKey, orderId 저장
      await paymentService.createPayment(
        { orderId, paymentKey, orderName, method, requestedAt, approvedAt, totalAmount, suppliedAmount, vat },
        tx,
      );
    });

    // 결제 성공 비즈니스 로직을 구현하세요.
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // 결제 실패 비즈니스 로직을 구현하세요.
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export default {
  confirmPayment,
};
