import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { companyMockData } from "./mocks/company.mock";
import { userMockData } from "./mocks/user.mock";
import { monthlyBudgetMockData } from "./mocks/monthly-budget.mock";
import { categoryMockData } from "./mocks/category.mock";
import { productMockData } from "./mocks/product.mock";
import { cartItemMockData } from "./mocks/cart-item.mock";
import { orderMockData } from "./mocks/order.mock";
import { receiptMockData } from "./mocks/receipt.mock";
import { orderedItemMockData } from "./mocks/ordered-item.mock";
import { inviteMockData } from "./mocks/invite.mock";
import { likeMockData } from "./mocks/like.mock";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Product 데이터만 업데이트하는 경우
  const UPDATE_PRODUCTS_ONLY = process.env.UPDATE_PRODUCTS_ONLY === "true";

  if (UPDATE_PRODUCTS_ONLY) {
    console.log("🔄 Updating products only...");

    // Product에 의존하는 데이터들 삭제
    console.log("🗑️ Deleting cart items (product dependency)...");
    await prisma.cartItem.deleteMany();

    console.log("🗑️ Deleting likes (product dependency)...");
    await prisma.like.deleteMany();

    console.log("🗑️ Deleting ordered items (product dependency)...");
    await prisma.orderedItem.deleteMany();

    // Product 삭제
    console.log("🗑️ Deleting products...");
    await prisma.product.deleteMany();

    // Product만 재생성
    console.log("🍪 Seeding products...");
    await prisma.product.createMany({
      data: productMockData,
      skipDuplicates: true,
    });

    console.log("✅ Products updated successfully!");
    return;
  }

  // 전체 데이터 삭제 (외래키 제약조건을 고려한 순서)
  console.log("🗑️ Deleting existing data...");

  // 1. OrderedItem 삭제 (Order, Receipt에 의존)
  console.log("🗑️ Deleting ordered items...");
  await prisma.orderedItem.deleteMany();

  // 2. Receipt 삭제 (의존성 없음)
  console.log("🗑️ Deleting receipts...");
  await prisma.receipt.deleteMany();

  // 3. Order 삭제 (User에 의존)
  console.log("🗑️ Deleting orders...");
  await prisma.order.deleteMany();

  // 3. Like 삭제 (User, Product에 의존)
  console.log("🗑️ Deleting likes...");
  await prisma.like.deleteMany();

  // 4. Invite 삭제 (User, Company에 의존)
  console.log("🗑️ Deleting invites...");
  await prisma.invite.deleteMany();

  // 5. CartItem 삭제 (User, Product에 의존)
  console.log("🗑️ Deleting cart items...");
  await prisma.cartItem.deleteMany();

  // 6. Product 삭제 (User, Category에 의존)
  console.log("🗑️ Deleting products...");
  await prisma.product.deleteMany();

  // 7. User 삭제 (Company에 의존)
  console.log("🗑️ Deleting users...");
  await prisma.user.deleteMany();

  // 8. MonthlyBudget 삭제 (Company에 의존)
  console.log("🗑️ Deleting monthly budgets...");
  await prisma.monthlyBudget.deleteMany();

  // 9. Category 삭제 (자체 참조)
  console.log("🗑️ Deleting categories...");
  await prisma.category.deleteMany();

  // 10. Company 삭제 (의존성 없음)
  console.log("🗑️ Deleting companies...");
  await prisma.company.deleteMany();

  console.log("✅ All existing data deleted successfully!");

  // 1. Company 데이터 삽입
  console.log("📦 Seeding companies...");
  await prisma.company.createMany({
    data: companyMockData,
    skipDuplicates: true,
  });

  // 2. User 데이터 삽입
  console.log("👥 Seeding users...");
  const hashedUserData = await Promise.all(
    userMockData.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
      role: user.role as any, // Role enum으로 캐스팅
    })),
  );

  await prisma.user.createMany({
    data: hashedUserData,
    skipDuplicates: true,
  });

  // 3. MonthlyBudget 데이터 삽입
  console.log("💰 Seeding monthly budgets...");
  await prisma.monthlyBudget.createMany({
    data: monthlyBudgetMockData,
    skipDuplicates: true,
  });

  // 4. Category 데이터 삽입
  console.log("🏷️ Seeding categories...");
  await prisma.category.createMany({
    data: categoryMockData,
    skipDuplicates: true,
  });

  // 5. Product 데이터 삽입
  console.log("🍪 Seeding products...");
  await prisma.product.createMany({
    data: productMockData,
    skipDuplicates: true,
  });

  // 6. CartItem 데이터 삽입
  console.log("🛒 Seeding cart items...");
  await prisma.cartItem.createMany({
    data: cartItemMockData,
    skipDuplicates: true,
  });

  // 7. Order 데이터 삽입
  console.log("📋 Seeding orders...");
  await prisma.order.createMany({
    data: orderMockData.map((order) => ({
      ...order,
      status: order.status as any, // OrderStatus enum으로 캐스팅
    })),
    skipDuplicates: true,
  });

  // 8. Receipt 데이터 삽입
  console.log("🧾 Seeding receipts...");
  await prisma.receipt.createMany({
    data: receiptMockData,
    skipDuplicates: true,
  });

  // 9. OrderedItem 데이터 삽입
  console.log("📦 Seeding ordered items...");
  await prisma.orderedItem.createMany({
    data: orderedItemMockData as any,
    skipDuplicates: true,
  });

  // 9. Invite 데이터 삽입
  console.log("📧 Seeding invites...");
  await prisma.invite.createMany({
    data: inviteMockData.map((invite) => ({
      ...invite,
      role: invite.role as any, // Role enum으로 캐스팅
    })),
    skipDuplicates: true,
  });

  // 10. Like 데이터 삽입
  console.log("❤️ Seeding likes...");
  await prisma.like.createMany({
    data: likeMockData,
    skipDuplicates: true,
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
