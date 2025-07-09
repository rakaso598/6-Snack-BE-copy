import { BadRequestError } from "../types/error";

export const parseNumberOrThrow = (value: string, fieldName: string): number => {
  const num = Number(value);

  if (isNaN(num)) {
    throw new BadRequestError(`${fieldName}이 숫자여야 합니다.`);
  }

  return num;
};
