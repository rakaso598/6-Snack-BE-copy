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

      // Redis에서 캐시된 데이터 확인
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        // 캐시된 데이터가 있으면 반환
        const parsedData = JSON.parse(cachedData);
        res.status(200).json(parsedData);
        return;
      }

      // 캐시된 데이터가 없으면 원본 응답을 캐시하도록 설정
      const originalJson = res.json;
      res.json = function (data: unknown): Response {
        // 응답 데이터를 Redis에 캐시 (TTL 설정)
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

// 캐시 무효화 미들웨어 함수 (특정 URL만 무효화)
export const invalidateCache = (url: string | null = null) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let cacheKey: string;

      if (url) {
        // 특정 URL의 캐시만 삭제
        cacheKey = `cache:${url}`;
      } else {
        // 현재 요청 URL의 캐시 삭제
        cacheKey = `cache:${req.originalUrl}`;
      }

      // 삭제 전에 해당 키가 실제로 존재하는지 확인
      const exists = await redis.exists(cacheKey);

      if (exists) {
        await redis.del(cacheKey);
      }

      // products 관련 모든 캐시 키를 패턴 매칭으로 삭제
      if (req.originalUrl.includes("/products") || (url && url.includes("/products"))) {
        const pattern = `cache:/products*`;
        const productKeys = await redis.keys(pattern);

        if (productKeys.length > 0) {
          await redis.del(...productKeys);
        }
      }

      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};
