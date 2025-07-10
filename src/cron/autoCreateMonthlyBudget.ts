import cron from "node-cron";
import prisma from "../config/prisma";
import getDateForBudget from "../utils/getDateForBudget";
import budgetRepository from "../repositories/budget.repository";

const autoCreateMonthlyBudget = cron.schedule(
  "0 0 0 1 * *",
  async () => {
    try {
      console.log("1. node-cron을 정상적으로 실행합니다!🕑");

      console.log("2. company를 찾는 중입니다...🔎");
      const companies = await prisma.company.findMany();

      if (!companies || companies.length === 0) {
        console.log("3. company가 존재하지 않습니다.❌ 이번 달 MonthlyBudget 생성 작업을 건너뜁니다.↩️");

        return;
      }

      console.log("3. 서비스를 이용중인 company가 존재합니다! MonthlyBudget 생성을 시작합니다.🎉");
      console.log("4. MonthlyBudget에 입력할 데이터를 생성하고 있습니다...📦");
      const { year, month, previousMonth } = getDateForBudget();

      const monthlyBudgetData = await Promise.all(
        companies.map(async ({ id, ...rest }) => {
          const previousMonthlyBudget = await budgetRepository.getMonthlyBudget({
            companyId: id,
            year,
            month: previousMonth,
          });

          return {
            companyId: id,
            currentMonthExpense: 0,
            currentMonthBudget: previousMonthlyBudget?.monthlyBudget ?? 0,
            monthlyBudget: previousMonthlyBudget?.monthlyBudget ?? 0,
            year,
            month,
          };
        }),
      );

      console.log("5. MonthlyBudget을 생성 중입니다...🚚");
      await prisma.monthlyBudget.createMany({
        data: monthlyBudgetData,
        skipDuplicates: false,
      });

      console.log("6. MonthlyBudget을 성공적으로 생성하였습니다!✅");
    } catch (e) {
      if (e instanceof Error) {
        console.error("※ MonthlyBudget을 생성하는 중 에러가 발생했습니다.❌");
        console.error(e.message);

        return;
      }
    }
  },
  { timezone: "Asia/Seoul" },
);

export default autoCreateMonthlyBudget;
