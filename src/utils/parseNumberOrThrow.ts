import { ValidationError } from "../types/error";

export const parseNumberOrThrow = (value: string, fieldName: string): number => {
  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName}에는 숫자만 입력해주세요.`);
  }

  return num;
};
