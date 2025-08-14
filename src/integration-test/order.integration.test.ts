import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import jwt from 'jsonwebtoken';
import getDateForBudget from '../utils/getDateForBudget';
import { cleanDatabase, createTestCompany, createTestUser, createTestCategory, createTestProduct, disconnectPrisma } from './test-utils';

const prisma = new PrismaClient();

describe('Order Integration Tests', () => {
  let testUser: any;
  let testCompany: any;
  let testProduct: any;
  let testCategory: any;
  let testCartItem: any;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 정리
    await cleanDatabase();

    // 테스트 데이터 생성
    testCompany = await createTestCompany();

    testCategory = await createTestCategory('테스트 카테고리');

    testUser = await createTestUser(testCompany.id, 'USER');
    const adminUser = await createTestUser(testCompany.id, 'ADMIN');

    testProduct = await createTestProduct(testUser.id, testCategory.id);

    testCartItem = await prisma.cartItem.create({
      data: {
        userId: testUser.id,
        productId: testProduct.id,
        quantity: 1
      }
    });

    // 현재 날짜에 맞는 월별 예산 생성
    const { year, month } = getDateForBudget();
    await prisma.monthlyBudget.create({
      data: {
        companyId: testCompany.id,
        currentMonthBudget: 100000,
        currentMonthExpense: 0,
        monthlyBudget: 100000,
        year,
        month
      }
    });

    // JWT 토큰 생성
    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: 'USER', companyId: testCompany.id },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: 'ADMIN', companyId: testCompany.id },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  afterEach(async () => {
    await prisma.receipt.deleteMany();
    await prisma.order.deleteMany();
  });

  describe('POST /orders', () => {
    test('구매 요청을 정상적으로 생성한다', async () => {
      const orderData = {
        cartItemIds: [testCartItem.id],
        requestMessage: '테스트 구매 요청입니다.',
        adminMessage: '관리자에게 남길 메시지'
      };

      const response = await request(app)
        .post('/orders')
        .set('Cookie', `accessToken=${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.requestMessage).toBe(orderData.requestMessage);
    });
  });

  describe('POST /admin/orders/instant', () => {
    test('즉시 구매를 정상적으로 처리한다', async () => {
      const orderData = { cartItemIds: [testCartItem.id] };

      const response = await request(app)
        .post('/admin/orders/instant')
        .set('Cookie', `accessToken=${adminToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.status).toBe('APPROVED');
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      // 테스트용 주문 2개 생성
      const orders = await Promise.all([
        prisma.order.create({
          data: {
            companyId: testCompany.id,
            userId: testUser.id,
            requestMessage: '테스트 주문 1',
            deliveryFee: 3000,
            productsPriceTotal: 10000,
            status: 'PENDING'
          }
        }),
        prisma.order.create({
          data: {
            companyId: testCompany.id,
            userId: testUser.id,
            requestMessage: '테스트 주문 2',
            deliveryFee: 3000,
            productsPriceTotal: 20000,
            status: 'APPROVED'
          }
        })
      ]);

      // receipt 생성
      await Promise.all(orders.map(order => 
        prisma.receipt.create({
          data: {
            productId: testProduct.id,
            orderId: order.id,
            productName: testProduct.name,
            price: testProduct.price,
            imageUrl: testProduct.imageUrl,
            quantity: 1
          }
        })
      ));
    });

    test('내 구매 요청 리스트를 정상적으로 조회한다', async () => {
      const response = await request(app)
        .get('/orders')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /orders/:orderId', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          companyId: testCompany.id,
          userId: testUser.id,
          requestMessage: '상세 조회 테스트 주문',
          deliveryFee: 3000,
          productsPriceTotal: 10000,
          status: 'PENDING'
        }
      });

      await prisma.receipt.create({
        data: {
          productId: testProduct.id,
          orderId: testOrder.id,
          productName: testProduct.name,
          price: testProduct.price,
          imageUrl: testProduct.imageUrl,
          quantity: 1
        }
      });
    });

    test('구매 요청 상세를 정상적으로 조회한다', async () => {
      const response = await request(app)
        .get(`/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testOrder.id);
      expect(response.body.data).toHaveProperty('requestMessage', '상세 조회 테스트 주문');
      expect(response.body.data).toHaveProperty('status', 'PENDING');
      expect(response.body.data).toHaveProperty('receipts');
      expect(response.body.data.receipts).toHaveLength(1);
    });

    test('존재하지 않는 주문 조회 시 404를 반환한다', async () => {
      await request(app)
        .get('/orders/non-existent-id')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /orders/:orderId', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          companyId: testCompany.id,
          userId: testUser.id,
          requestMessage: '취소 테스트 주문',
          deliveryFee: 3000,
          productsPriceTotal: 10000,
          status: 'PENDING'
        }
      });
    });

    test('구매 요청을 정상적으로 취소한다', async () => {
      const response = await request(app)
        .patch(`/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .send({ status: 'CANCELED' })
        .expect(200);

      expect(response.body).toHaveProperty('message', '구매 요청이 성공적으로 취소되었습니다.');

      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id }
      });
      expect(updatedOrder?.status).toBe('CANCELED');
    });

    test('승인된 주문은 취소할 수 없다', async () => {
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'APPROVED' }
      });

      await request(app)
        .patch(`/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .send({ status: 'CANCELED' })
        .expect(400);
    });
  });

  describe('PATCH /admin/orders/:orderId (관리자 승인/반려)', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          companyId: testCompany.id,
          userId: testUser.id,
          requestMessage: '승인 테스트 주문',
          deliveryFee: 3000,
          productsPriceTotal: 10000,
          status: 'PENDING'
        }
      });

      await prisma.receipt.create({
        data: {
          productId: testProduct.id,
          orderId: testOrder.id,
          productName: testProduct.name,
          price: testProduct.price,
          imageUrl: testProduct.imageUrl,
          quantity: 1
        }
      });
    });

    test('관리자가 주문을 승인한다', async () => {
      const response = await request(app)
        .patch(`/admin/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          status: 'APPROVED',
          approver: '관리자',
          adminMessage: '승인합니다.'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'APPROVED');
      expect(response.body).toHaveProperty('approver', '관리자');
      expect(response.body).toHaveProperty('adminMessage', '승인합니다.');
    });

    test('관리자가 주문을 반려한다', async () => {
      const response = await request(app)
        .patch(`/admin/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          status: 'REJECTED',
          approver: '관리자',
          adminMessage: '반려합니다.'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'REJECTED');
      expect(response.body).toHaveProperty('approver', '관리자');
      expect(response.body).toHaveProperty('adminMessage', '반려합니다.');
    });

    test('일반 사용자는 주문을 승인/반려할 수 없다', async () => {
      await request(app)
        .patch(`/admin/orders/${testOrder.id}`)
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          status: 'APPROVED',
          approver: '사용자',
          adminMessage: '승인합니다.'
        })
        .expect(403);
    });
  });
}); 