/**
 * 현재 년도와 월을 가져오는 유틸 함수
 * @returns {object} 현재 년도와 월
 */
export const getCurrentYearAndMonth = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  
  return { currentYear, currentMonth };
};

/**
 * 날짜가 만료되었는지 확인하는 유틸 함수
 * @param expiresAt 만료 날짜
 * @returns {boolean} 만료 여부
 */
export const isExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
}; 