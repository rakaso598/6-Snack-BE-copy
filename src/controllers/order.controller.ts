import { RequestHandler } from "express";
import orderService from "../services/order.service";
import {
  TGetOrderParamsDto,
  TGetOrderQueryDto,
  TGetOrdersQueryDto,
  TUpdateStatusOrderBodyDto,
} from "../dtos/order.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import { AuthenticationError, NotFoundError } from "../types/error";
import orderRepository from "../repositories/order.repository";

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     tags:
 *       - Order
 *     summary: 구매 내역 조회 (대기 or 승인)
 *     description: 관리자 권한으로 대기 중인 주문 또는 승인된 주문 내역을 페이지네이션과 정렬 옵션과 함께 조회합니다.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved]
 *         required: true
 *         description: "주문 상태 (pending: 대기, approved: 승인)"
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: 페이지 번호 (기본값 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         required: false
 *         description: 한 페이지당 항목 수 (기본값 4)
 *         example: 4
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [latest, priceLow, priceHigh]
 *         required: false
 *         description: "정렬 기준 (latest: 최신순, priceLow: 가격 낮은순, priceHigh: 가격 높은순)"
 *         example: latest
 *     responses:
 *       200:
 *         description: 주문 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 50
 *                       companyId:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: string
 *                         example: "user-1"
 *                       approver:
 *                         type: string
 *                         nullable: true
 *                         example: "최고관리자"
 *                       adminMessage:
 *                         type: string
 *                         example: "관리자에게 남길 메시지"
 *                       requestMessage:
 *                         type: string
 *                         nullable: true
 *                         example: "요청 이요"
 *                       totalPrice:
 *                         type: integer
 *                         example: 16500
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T07:02:14.343Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T07:02:14.343Z"
 *                       status:
 *                         type: string
 *                         enum: [PENDING, APPROVED]
 *                         example: "PENDING"
 *                       requester:
 *                         type: string
 *                         example: "최고관리자"
 *                       productName:
 *                         type: string
 *                         example: "오리온 초코파이 외 1건"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       example: 2
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 4
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: "잘못된 요청 (예: status 누락 또는 잘못된 값)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "상태(pending, approved)를 입력해주세요."
 *       401:
 *         description: 인증 실패 또는 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 유저입니다."
 *       404:
 *         description: 주문 내역을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "주문 내역을 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "알 수 없는 서버 오류가 발생했습니다."
 */

// 구매내역 조회(대기 or 승인)
const getOrders: RequestHandler<{}, {}, {}, TGetOrdersQueryDto> = async (req, res, next) => {
  const page = parseNumberOrThrow(req.query.page ?? "1", "page");
  const limit = parseNumberOrThrow(req.query.limit ?? "4", "limit");
  const { orderBy, status } = req.query;
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const companyId = user.companyId;

  const orderList = await orderService.getOrders({ page, limit, orderBy, status }, companyId);

  res.status(200).json(orderList);
};

/**
 * @swagger
 * /admin/orders/{orderId}:
 *   get:
 *     summary: 구매내역 상세 조회 (대기 or 승인)
 *     description: |
 *       주문 ID와 상태(pending, approved)를 기준으로 특정 구매 요청 상세 정보를 조회합니다.
 *       ADMIN 또는 SUPER_ADMIN 권한이 필요합니다.
 *     tags:
 *       - Order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: 조회할 주문 고유 ID
 *         schema:
 *           type: integer
 *           example: 50
 *       - in: query
 *         name: status
 *         required: true
 *         description: 상태 값 ("pending" 또는 "approved")
 *         schema:
 *           type: string
 *           enum: [pending, approved]
 *           example: pending
 *     responses:
 *       200:
 *         description: 주문 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 50
 *                 companyId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: string
 *                   example: user-1
 *                 approver:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 adminMessage:
 *                   type: string
 *                   example: 관리자에게 남길 메시지
 *                 requestMessage:
 *                   type: string
 *                   nullable: true
 *                   example: 요청 이요
 *                 totalPrice:
 *                   type: integer
 *                   example: 16500
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-01T07:02:14.343Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-01T07:02:14.343Z
 *                 status:
 *                   type: string
 *                   example: PENDING
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user-1
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: super_admin@codeit.com
 *                     name:
 *                       type: string
 *                       example: 최고관리자
 *                     password:
 *                       type: string
 *                       example: "$2b$10$1Wfev82g49/Y96n1Z00EmOAcvsUsAlvpkV8epDkzP36IzKSdp.V/W"
 *                     companyId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T00:00:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-08-02T18:08:17.741Z
 *                     deletedAt:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     hashedRefreshToken:
 *                       type: string
 *                       example: "$2b$10$Gb9HggcTszQWthR/cjaEXeFP.lKhtp/b98bPXIz3yzhhfK1QOVL66"
 *                     role:
 *                       type: string
 *                       example: SUPER_ADMIN
 *                 requester:
 *                   type: string
 *                   example: 최고관리자
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 116
 *                       productId:
 *                         type: integer
 *                         example: 1
 *                       orderId:
 *                         type: integer
 *                         example: 50
 *                       productName:
 *                         type: string
 *                         example: 오리온 초코파이
 *                       price:
 *                         type: integer
 *                         example: 1500
 *                       imageUrl:
 *                         type: string
 *                         format: uri
 *                         example: https://team3-snack-s3.s3.amazonaws.com/products/orion-chocopie.png
 *                       quantity:
 *                         type: integer
 *                         example: 10
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-01T07:02:14.366Z
 *                 budget:
 *                   type: object
 *                   properties:
 *                     currentMonthBudget:
 *                       type: integer
 *                       nullable: true
 *                       example: 1000000
 *                     currentMonthExpense:
 *                       type: integer
 *                       nullable: true
 *                       example: 477790
 *       400:
 *         description: 요청 쿼리 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "상태(pending, approved)를 입력해주세요."
 *       401:
 *         description: 인증 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 유저입니다."
 *       404:
 *         description: 주문 또는 예산을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "주문 내역을 찾을 수 없습니다."
 */

// 구매내역 상세 조회(대기 or 승인)
const getOrder: RequestHandler<TGetOrderParamsDto, {}, {}, TGetOrderQueryDto> = async (req, res, next) => {
  const orderId = req.params.orderId;
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const { status } = req.query;

  if (!status) {
    const order = await orderRepository.getOrderById(orderId);

    if (!order) throw new NotFoundError("주문 정보를 찾을 수 없습니다.");

    res.status(200).json(order);
    return;
  }

  const companyId = user.companyId;

  const order = await orderService.getOrder(orderId, status, companyId);

  res.status(200).json(order);
};

/**
 * @swagger
 * /admin/orders/{orderId}:
 *   patch:
 *     summary: 구매 승인 또는 반려
 *     description: ADMIN 또는 SUPER_ADMIN 권한을 가진 사용자가 특정 주문을 승인하거나 반려합니다.
 *     tags:
 *       - Order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 주문의 고유 ID
 *         example: 11
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: 주문 상태 (APPROVED 또는 REJECTED)
 *                 enum: [APPROVED, REJECTED]
 *                 example: APPROVED
 *               adminMessage:
 *                 type: string
 *                 description: 관리자 메시지 (선택)
 *                 example: 승인되었습니다.
 *     responses:
 *       200:
 *         description: 주문 상태가 성공적으로 업데이트됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 11
 *                 companyId:
 *                   type: integer
 *                   example: 1
 *                 userId:
 *                   type: string
 *                   example: user-1
 *                 approver:
 *                   type: string
 *                   example: 최고관리자
 *                 adminMessage:
 *                   type: string
 *                   example: 승인되었습니다.
 *                 requestMessage:
 *                   type: string
 *                   example: 요청 이요
 *                 totalPrice:
 *                   type: integer
 *                   example: 76700
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-07-31T04:18:29.869Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-02T18:08:58.273Z
 *                 status:
 *                   type: string
 *                   example: APPROVED
 *       400:
 *         description: 요청값 유효성 검사 실패
 *         content:
 *           application/json:
 *             examples:
 *               missingStatus:
 *                 summary: status 누락
 *                 value:
 *                   message: 상태 값을 입력해주세요.
 *               invalidStatus:
 *                 summary: status 값이 허용되지 않은 경우
 *                 value:
 *                   message: 올바른 상태를 입력해주세요.
 *       401:
 *         description: 인증되지 않은 사용자
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효하지 않은 유저입니다.
 *       403:
 *         description: 권한 없음 (ADMIN 또는 SUPER_ADMIN만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 권한이 없습니다.
 *       404:
 *         description: 주문 또는 예산 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 주문을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 알 수 없는 서버 오류가 발생했습니다.
 */

// 구매 승인 | 구매 반려
const updateOrder: RequestHandler<TGetOrderParamsDto, {}, TUpdateStatusOrderBodyDto> = async (req, res, next) => {
  const user = req.user;

  if (!user) throw new AuthenticationError("유효하지 않은 유저입니다.");

  const approver = user.name;
  const companyId = user.companyId;
  const orderId = req.params.orderId;
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

    const order = await orderService.createOrder(authenticatedOrderData);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const getOrderById: RequestHandler<{ orderId: string }> = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

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
    const orderId = req.params.orderId;

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
