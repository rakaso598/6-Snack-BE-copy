import { subMonths, subYears } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const getDateForBudget = () => {
  const date = new Date();
  const timeZone = "Asia/Seoul";

  const year = formatInTimeZone(date, timeZone, "yyyy");
  const month = formatInTimeZone(date, timeZone, "MM");
  const previousYear = formatInTimeZone(subYears(date, 1), timeZone, "yyyy");
  const previousMonth = formatInTimeZone(subMonths(date, 1), timeZone, "MM");

  return {
    year,
    month,
    previousYear,
    previousMonth,
  };
};

export default getDateForBudget;
