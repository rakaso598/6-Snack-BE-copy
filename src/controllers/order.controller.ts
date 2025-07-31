import { RequestHandler } from "express";
import orderService from "../services/order.service";
import { TGetOrderParamsDto, TGetOrdersQueryDto, TUpdateStatusOrderBodyDto } from "../dtos/order.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import { AuthenticationError } from "../types/error";

// 구매내역 조회(대기 or 승인)
const getOrders: RequestHandler<{}, {}, {}, TGetOrdersQueryDto> = async (req, res, next) => {
  const offset = parseNumberOrThrow(req.query.offset ?? "0", "offset");
  const limit = parseNumberOrThrow(req.query.limit ?? "4", "limit");
  const { orderBy, status } = req.query;
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const companyId = user.companyId;

  const orderList = await orderService.getOrders({ offset, limit, orderBy, status }, companyId);

  res.status(200).json(orderList);
};

// 구매내역 상세 조회(대기 or 승인)
const getOrder: RequestHandler<TGetOrderParamsDto, {}, {}, TGetOrdersQueryDto> = async (req, res, next) => {
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");
  const { status } = req.query;
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const companyId = user.companyId;

  const order = await orderService.getOrder(orderId, status, companyId);

  res.status(200).json(order);
};

// 구매 승인 | 구매 반려
const updateOrder: RequestHandler<TGetOrderParamsDto, {}, TUpdateStatusOrderBodyDto> = async (req, res, next) => {
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const approver = user.name;
  const companyId = user.companyId;
  const orderId = parseNumberOrThrow(req.params.orderId, "orderId");
  const { adminMessage = "", status } = req.body;

  const updatedOrder = await orderService.updateOrder(orderId, companyId, { approver, adminMessage, status });

  res.status(200).json(updatedOrder);
};

// OrderRequest 관련 기능들 추가
const createOrder: RequestHandler<
  {},
  {},
  { adminMessage?: string; requestMessage?: string; cartItemIds: number[] }
> = async (req, res, next) => {
  try {
    const orderData = req.body;

    if (!req.user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    // 인증된 사용자의 ID를 사용
    const authenticatedOrderData = {
      ...orderData,
      userId: req.user.id,
      companyId: req.user.companyId,
    };

    const result = await orderService.createOrder(authenticatedOrderData);

    res.status(201).json({
      message: "구매 요청이 성공적으로 생성되었습니다.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById: RequestHandler<{ orderId: string }> = async (req, res, next) => {
  try {
    const orderId = parseNumberOrThrow(req.params.orderId, "orderId");

    if (!req.user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const result = await orderService.getOrderById(orderId, req.user.id);

    res.status(200).json({
      message: "구매 요청 조회가 완료되었습니다.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersByUserId: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const result = await orderService.getOrdersByUserId(req.user.id);

    res.status(200).json({
      message: "내 구매 요청 리스트 조회가 완료되었습니다.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder: RequestHandler<{ orderId: string }, {}, { status: "CANCELED" }> = async (req, res, next) => {
  try {
    const orderId = parseNumberOrThrow(req.params.orderId, "orderId");

    if (!req.user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const result = await orderService.cancelOrder(orderId, req.user.id);

    res.status(200).json({
      message: "구매 요청이 성공적으로 취소되었습니다.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createInstantOrder: RequestHandler<{}, {}, { cartItemIds: number[] }> = async (req, res, next) => {
  try {
    const orderData = req.body;

    if (!req.user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    // 인증된 사용자의 ID를 사용 (메시지 필드 제거)
    const authenticatedOrderData = {
      cartItemIds: orderData.cartItemIds,
      userId: req.user.id,
      companyId: req.user.companyId,
    };

    // 1. 주문 생성
    const result = await orderService.createInstantOrder(authenticatedOrderData);

    // 2. orderService를 사용하여 승인 처리
    const approvedOrder = await orderService.updateOrder(result.id, req.user.companyId, {
      approver: req.user.name || "시스템",
      adminMessage: "즉시 구매로 자동 승인",
      status: "APPROVED",
    });

    res.status(201).json({
      message: "즉시 구매가 성공적으로 완료되었습니다.",
      data: approvedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getOrders,
  getOrder,
  updateOrder,
  // OrderRequest 관련 기능들
  createOrder,
  getOrderById,
  getOrdersByUserId,
  cancelOrder,
  createInstantOrder,
};
