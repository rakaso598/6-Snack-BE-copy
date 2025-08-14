import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function cleanDatabase() {
  // 외래키 제약 조건을 고려한 순서로 테이블 정리
  const tables = [
    "Receipt",
    "Order", 
    "CartItem",
    "Favorite",
    "Product",
    "Category",
    "MonthlyBudget",
    "User",
    "Company"
  ];

  for (const table of tables) {
    try {
      // 테이블명을 직접 사용하여 TRUNCATE 실행
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (error) {
      console.warn(`Failed to truncate table ${table}:`, error);
    }
  }
}

export async function createTestCompany() {
  // 고유한 bizNumber 생성
  const timestamp = Date.now();
  const bizNumber = `1234567890${timestamp}`;
  
  return await prisma.company.create({
    data: { 
      name: `테스트 회사 ${timestamp}`, 
      bizNumber
    },
  });
}

export async function createTestUser(companyId: number, role: "USER" | "ADMIN" | "SUPER_ADMIN" = "USER") {
  const timestamp = Date.now();
  const email = `${role.toLowerCase()}${timestamp}@example.com`;
  const name = role === "USER" ? "일반 사용자" : role === "ADMIN" ? "관리자" : "최고 관리자";
  
  return await prisma.user.create({
    data: {
      email,
      name,
      password: "hashedPassword",
      companyId,
      role,
    },
  });
}

export async function createTestCategory(name: string, parentId?: number) {
  return await prisma.category.create({ 
    data: { 
      name,
      ...(parentId && { parentId })
    } 
  });
}

export async function createTestProduct(creatorId: string, categoryId: number) {
  const timestamp = Date.now();
  
  return await prisma.product.create({
    data: {
      name: `테스트 상품 ${timestamp}`,
      price: 10000,
      imageUrl: "https://example.com/test.jpg",
      linkUrl: "https://example.com/test",
      categoryId,
      creatorId,
    },
  });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
