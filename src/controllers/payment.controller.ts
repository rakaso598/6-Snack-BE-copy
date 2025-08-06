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
  const { paymentKey, orderId, amount } = req.body;

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
      // 결제 조회, 결제 취소에 사용될 paymentKey, orderId 저장
      await paymentService.createPayment(
        { orderId, paymentKey, orderName, method, requestedAt, approvedAt, totalAmount, suppliedAmount, vat },
        tx,
      );
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export default {
  confirmPayment,
};
