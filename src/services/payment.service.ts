import { Payment, Prisma } from "@prisma/client";
import paymentRepository from "../repositories/payment.repository";

const createPayment = async (body: Omit<Payment, "id">, tx: Prisma.TransactionClient) => {
  return await paymentRepository.createPayment(body, tx);
};

export default {
  createPayment,
};
