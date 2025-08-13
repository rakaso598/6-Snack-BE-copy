import { RequestHandler } from "express";
import budgetService from "../services/budget.service";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import { TBudgetParamsDto } from "../dtos/budget.dto";
import { TUpdateMonthlyBudgetBody } from "../types/budget.type";

/**
 * @swagger
 * tags:
 *   - name: Budget
 *     description: 예산 API
 */

/**
 * @swagger
 * /admin/{companyId}/budgets:
 *   get:
 *     tags:
 *       - Budget
 *     summary: 예산 및 지출 조회
 *     description: 특정 회사(companyId)의 월별 예산과 지출 현황을 조회합니다.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: companyId
 *         in: path
 *         description: 예산을 조회할 회사의 고유 ID (숫자)
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 예산 및 지출 현황 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 6
 *                 companyId:
 *                   type: integer
 *                   example: 1
 *                 currentMonthExpense:
 *                   type: integer
 *                   description: 이번달 지출액
 *                   example: 398090
 *                 currentMonthBudget:
 *                   type: integer
 *                   description: 이번달 예산
 *                   example: 100000
 *                 monthlyBudget:
 *                   type: integer
 *                   description: 매달 예산
 *                   example: 1000000
 *                 year:
 *                   type: string
 *                   description: 연도 (YYYY)
 *                   example: "2025"
 *                 month:
 *                   type: string
 *                   description: 월 (MM)
 *                   example: "08"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-31T15:00:00.527Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-02T17:42:05.117Z"
 *                 deletedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: soft delete를 위한 필드
 *                   example: null
 *                 currentYearTotalExpense:
 *                   type: integer
 *                   description: 올해 총 지출액
 *                   example: 1189190
 *                 previousMonthBudget:
 *                   type: integer
 *                   description: 저번달 예산
 *                   example: 600000
 *                 previousMonthExpense:
 *                   type: integer
 *                   description: 저번달 지출액
 *                   example: 746100
 *                 previousYearTotalExpense:
 *                   type: integer
 *                   description: 저번달 총 지출액
 *                   example: 715000
 *       401:
 *         description: 인증 토큰이 없거나 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 인증 토큰이 제공되지 않았습니다.
 *       403:
 *         description: 권한 없음 (ADMIN 또는 SUPER_ADMIN 만 접근 가능)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 권한이 없습니다.
 *       404:
 *         description: 예산 정보가 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 예산이 존재하지 않습니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 인증 중 알 수 없는 오류가 발생했습니다.
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 */

// 예산 및 지출 현황 조회(관리자, 최고 관리자)
const getMonthlyBudget: RequestHandler<TBudgetParamsDto> = async (req, res, next) => {
  const companyId = parseNumberOrThrow(req.params.companyId, "companyId");
  const budget = await budgetService.getMonthlyBudget(companyId);

  res.status(200).json(budget);
};

/**
 * @swagger
 * /super-admin/{companyId}/budgets:
 *   patch:
 *     summary: 예산 수정
 *     description: 최고 관리자 이상의 사용자만 접근 가능하며, 특정 회사의 이번 달 예산을 수정합니다.
 *     tags:
 *       - Budget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정하려는 회사의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentMonthBudget
 *               - monthlyBudget
 *             properties:
 *               currentMonthBudget:
 *                 type: integer
 *                 description: 이번 달 예산 (0 이상의 숫자)
 *                 example: 100000
 *               monthlyBudget:
 *                 type: integer
 *                 description: 매달 예산 (0 이상의 숫자)
 *                 example: 1000000
 *     responses:
 *       200:
 *         description: 수정된 월별 예산 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 companyId:
 *                   type: integer
 *                 currentMonthExpense:
 *                   type: integer
 *                   description: 이번 달 지출액
 *                 currentMonthBudget:
 *                   type: integer
 *                 monthlyBudget:
 *                   type: integer
 *                 year:
 *                   type: string
 *                   example: "2025"
 *                 month:
 *                   type: string
 *                   example: "08"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 deletedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: soft delete를 위한 삭제 시간, null이면 삭제되지 않은 상태
 *       400:
 *         description: "요청 바디 유효성 검사 실패 (예: 음수 또는 문자열 입력)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "예산은 0원 이상으로 설정해주세요."
 *       401:
 *         description: 인증 토큰이 없거나 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "인증 토큰이 제공되지 않았습니다."
 *       403:
 *         description: 권한 부족 (SUPER_ADMIN 권한 필요)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "권한이 없습니다."
 *       404:
 *         description: 수정하려는 회사의 예산 정보가 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "예산이 존재하지 않습니다."
 */

// 예산 수정(최고 관리자)
const updateMonthlyBudget: RequestHandler<TBudgetParamsDto, {}, TUpdateMonthlyBudgetBody> = async (req, res, next) => {
  const companyId = parseNumberOrThrow(req.params.companyId, "companyId");
  const body = req.body;

  const updatedBudget = await budgetService.updateMonthlyBudget(companyId, body);

  res.status(200).json(updatedBudget);
};

export default {
  getMonthlyBudget,
  updateMonthlyBudget,
};
