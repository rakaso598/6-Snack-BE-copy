import paymentService from "../services/payment.service";
import paymentRepository from "../repositories/payment.repository";
import { Payment } from "@prisma/client";

// paymentRepository 모킹
jest.mock("../repositories/payment.repository");

describe("paymentService.createPayment", () => {
  const mockTx = {}; // 트랜잭션 mock 객체

  const mockPaymentData: Omit<Payment, "id"> = {
    paymentKey: "paykey-123",
    orderId: "order-id-123",
    orderName: "테스트 상품",
    method: "카드",
    requestedAt: "2025-08-10T00:00:00Z",
    approvedAt: "2025-08-10T00:01:00Z",
    totalAmount: 10000,
    suppliedAmount: 9000,
    vat: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("정상적으로 paymentRepository.createPayment를 호출하고 결과를 반환한다", async () => {
    const mockReturnValue = { id: 1, ...mockPaymentData };
    (paymentRepository.createPayment as jest.Mock).mockResolvedValue(mockReturnValue);

    const result = await paymentService.createPayment(mockPaymentData, mockTx as any);

    expect(paymentRepository.createPayment).toHaveBeenCalledWith(mockPaymentData, mockTx);
    expect(result).toEqual(mockReturnValue);
  });

  test("paymentRepository.createPayment에서 오류 발생 시 예외를 던진다", async () => {
    (paymentRepository.createPayment as jest.Mock).mockRejectedValue(new Error("DB 오류"));

    await expect(paymentService.createPayment(mockPaymentData, mockTx as any)).rejects.toThrow("DB 오류");
    expect(paymentRepository.createPayment).toHaveBeenCalledWith(mockPaymentData, mockTx);
  });
});
