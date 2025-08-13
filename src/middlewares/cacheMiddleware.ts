import Redis from "ioredis";
import "dotenv/config";
import { Request, Response, NextFunction } from "express";

// Redis 클라이언트 생성
const redis = new Redis({
  host: process.env.NODE_ENV === "production" ? process.env.REDIS_HOST : "127.0.0.1",
  port: 6379,
});

// 연결 상태 모니터링
redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// 캐시 미들웨어 함수 (TTL을 매개변수로 받음)
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cacheKey = `cache:${req.originalUrl}`;

      // 테스트용 로그 추가
      console.log("🔍 [CACHE] GET 요청 - 캐시 키:", cacheKey);
      console.log("🔍 [CACHE] 전체 URL:", req.originalUrl);
      console.log("🔍 [CACHE] 쿼리 파라미터:", req.query);

      // Redis에서 캐시된 데이터 확인
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        // 캐시된 데이터가 있으면 반환
        console.log("✅ [CACHE] 캐시 히트! 캐시된 데이터 반환");
        const parsedData = JSON.parse(cachedData);
        res.status(200).json(parsedData);
        return;
      }

      console.log("❌ [CACHE] 캐시 미스! 새로운 데이터를 캐시에 저장");

      // 캐시된 데이터가 없으면 원본 응답을 캐시하도록 설정
      const originalJson = res.json;
      res.json = function (data: unknown): Response {
        // 응답 데이터를 Redis에 캐시 (TTL 설정)
        console.log("💾 [CACHE] 데이터를 캐시에 저장:", cacheKey, "TTL:", ttl);
        redis.setex(cacheKey, ttl, JSON.stringify(data));

        // 원본 json 메서드 호출
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      // Redis 에러가 발생해도 애플리케이션은 계속 동작하도록 next() 호출
      next();
    }
  };
};

// 캐시 무효화 미들웨어 함수 (패턴 기반 캐시 무효화)
export const invalidateCache = (pattern: string | null = null) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let cacheKey: string;

      if (pattern) {
         const fullPattern = pattern.startsWith("cache:") ? pattern : `cache:${pattern}`;
        // 특정 패턴의 캐시만 삭제
        console.log("🗑️ [INVALIDATE] 패턴 기반 캐시 무효화 시작:", fullPattern);
        const keys = await redis.keys(fullPattern);
        console.log("🔍 [INVALIDATE] 패턴 매칭된 캐시 키들:", keys);

        if (keys.length > 0) {
          await redis.del(...keys);
          console.log("✅ [INVALIDATE] 패턴 기반 캐시 무효화 완료:", keys.length, "개");
        } else {
          console.log("⚠️ [INVALIDATE] 패턴 매칭된 캐시가 없음");
        }
      } else {
        // 현재 요청 URL의 캐시 삭제
        cacheKey = `cache:${req.originalUrl}`;
        console.log("🗑️ [INVALIDATE] 현재 요청 URL 캐시 삭제:", cacheKey);

        const exists = await redis.exists(cacheKey);
        console.log("🔍 [INVALIDATE] 삭제할 캐시 키 존재 여부:", exists ? "존재" : "존재하지 않음");

        if (exists) {
          await redis.del(cacheKey);
          console.log("✅ [INVALIDATE] 현재 URL 캐시 삭제 완료");
        } else {
          console.log("⚠️ [INVALIDATE] 삭제할 캐시가 존재하지 않음");
        }
      }

      // 디버깅: 현재 Redis에 저장된 모든 캐시 키 확인
      const allKeys = await redis.keys("cache:*");
      console.log("🔍 [INVALIDATE] Redis에 저장된 모든 캐시 키:", allKeys);

      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};
