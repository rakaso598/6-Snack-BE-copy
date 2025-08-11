// src/jobs/autoCreateMonthlyBudget.ts

import cron from "node-cron";
import createMonthlyBudget from "./createMonthlyBudget";

const autoCreateMonthlyBudget = cron.schedule(
  "0 0 0 1 * *",
  async () => {
    try {
      await createMonthlyBudget();
    } catch (e) {
      if (e instanceof Error) {
        console.error("⚠️MonthlyBudget을 생성하는 중 에러가 발생했습니다.⚠️");
        console.error(e.message);
      }
    }
  },
  { timezone: "Asia/Seoul" },
);

export default autoCreateMonthlyBudget;
