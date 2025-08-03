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
import { inviteMockData } from "./mocks/invite.mock";
import { favoriteMockData } from "./mocks/favorite.mock";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 전체 데이터 삭제 (외래키 제약조건을 고려한 순서)
  console.log("🗑️ Deleting existing data...");

  // 1. Receipt 삭제 (의존성 없음)
  console.log("🗑️ Deleting receipts...");
  await prisma.receipt.deleteMany();

  // 2. Order 삭제 (User에 의존)
  console.log("🗑️ Deleting orders...");
  await prisma.order.deleteMany();

  // 3. Favorite 삭제 (User, Product에 의존)
  console.log("🗑️ Deleting favorites...");
  await prisma.favorite.deleteMany();

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

  // PostgreSQL autoincrement 시퀀스 리셋
  console.log("🔄 Resetting autoincrement sequences...");
  await prisma.$executeRaw`ALTER SEQUENCE "Company_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Category_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "CartItem_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Receipt_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "Favorite_id_seq" RESTART WITH 1;`;
  await prisma.$executeRaw`ALTER SEQUENCE "MonthlyBudget_id_seq" RESTART WITH 1;`;

  // 1. Company 데이터 삽입
  console.log("📦 Seeding companies...");
  const companies = await prisma.company.createMany({
    data: companyMockData,
    skipDuplicates: true,
  });

  // 생성된 Company들의 id를 가져옴
  const createdCompanies = await prisma.company.findMany();
  const firstCompanyId = createdCompanies[0]?.id;
  const secondCompanyId = createdCompanies[1]?.id;

  if (!firstCompanyId) {
    throw new Error("No company created");
  }

  // 2. User 데이터 삽입
  console.log("👥 Seeding users...");
  const hashedUserData = await Promise.all(
    userMockData.map(async (user, index) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
      role: user.role as any, // Role enum으로 캐스팅
      companyId: index === 1 ? secondCompanyId : firstCompanyId, // user-1-2는 두 번째 회사에, 나머지는 첫 번째 회사에
    })),
  );

  await prisma.user.createMany({
    data: hashedUserData,
    skipDuplicates: true,
  });

  // 3. MonthlyBudget 데이터 삽입
  console.log("💰 Seeding monthly budgets...");
  
  await prisma.monthlyBudget.createMany({
    data: monthlyBudgetMockData.map((budget) => ({
      ...budget,
      companyId: budget.companyId === 1 ? firstCompanyId : secondCompanyId,
    })),
    skipDuplicates: true,
  });

  // 4. Category 데이터 삽입
  console.log("🏷️ Seeding categories...");

  // Category를 개별적으로 생성하여 parentId 관계 설정
  const categories: any[] = [];
  const categoryMap = new Map(); // name -> id 매핑

  for (const category of categoryMockData) {
    let parentId = null;

    // parentId가 숫자인 경우, 해당 인덱스의 카테고리를 찾아서 id를 가져옴
    if (category.parentId !== null) {
      const parentIndex = category.parentId - 1; // 1-based to 0-based
      if (parentIndex >= 0 && parentIndex < categories.length) {
        parentId = categories[parentIndex].id;
      }
    }

    const createdCategory = await prisma.category.create({
      data: {
        name: category.name,
        parentId: parentId,
      },
    });

    categories.push(createdCategory);
    categoryMap.set(category.name, createdCategory.id);
  }

  // 5. Product 데이터 삽입
  console.log("🍪 Seeding products...");
  await prisma.product.createMany({
    data: productMockData.map((product) => ({
      ...product,
      categoryId: categories[product.categoryId - 1].id, // categoryId를 실제 생성된 id로 매핑
    })),
    skipDuplicates: true,
  });

  // 생성된 Product들의 id를 가져옴
  const createdProducts = await prisma.product.findMany();
  const productIdMap = new Map(); // 원래 인덱스 -> 실제 id 매핑
  createdProducts.forEach((product, index) => {
    productIdMap.set(index + 1, product.id); // 1-based 인덱스로 매핑
  });

  // 6. CartItem 데이터 삽입
  console.log("🛒 Seeding cart items...");
  await prisma.cartItem.createMany({
    data: cartItemMockData.map((cartItem) => ({
      ...cartItem,
      productId: productIdMap.get(cartItem.productId), // 실제 생성된 Product id로 매핑
    })),
    skipDuplicates: true,
  });

  // 7. Order 데이터 삽입
  console.log("📋 Seeding orders...");
  
  await prisma.order.createMany({
    data: orderMockData.map((order) => ({
      ...order,
      companyId: order.companyId === 1 ? firstCompanyId : secondCompanyId,
      status: order.status as any,
    })),
    skipDuplicates: true,
  });

  // 생성된 Order들의 id를 가져옴
  const createdOrders = await prisma.order.findMany();
  const orderIdMap = new Map(); // 원래 인덱스 -> 실제 id 매핑
  createdOrders.forEach((order, index) => {
    orderIdMap.set(index + 1, order.id); // 1-based 인덱스로 매핑
  });

  // 8. Receipt 데이터 삽입
  console.log("🧾 Seeding receipts...");
  await prisma.receipt.createMany({
    data: receiptMockData.map((receipt) => ({
      ...receipt,
      productId: productIdMap.get(receipt.productId), // 실제 생성된 Product id로 매핑
      orderId: orderIdMap.get(receipt.orderId), // 실제 생성된 Order id로 매핑
    })),
    skipDuplicates: true,
  });

  // 9. Invite 데이터 삽입
  console.log("📧 Seeding invites...");
  await prisma.invite.createMany({
    data: inviteMockData.map((invite) => ({
      ...invite,
      companyId: firstCompanyId, // 첫 번째 회사에 할당
      role: invite.role as any, // Role enum으로 캐스팅
    })),
    skipDuplicates: true,
  });

  // 10. Favorite 데이터 삽입
  console.log("❤️ Seeding favorites...");
  await prisma.favorite.createMany({
    data: favoriteMockData.map((favorite) => ({
      ...favorite,
      productId: productIdMap.get(favorite.productId), // 실제 생성된 Product id로 매핑
    })),
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
