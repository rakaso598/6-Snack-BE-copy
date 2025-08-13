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
export const cacheMiddleware = (indexUrl: string, ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cacheKey = `cache:${req.originalUrl}`;
      const cacheIndexKey = `cache_index:${indexUrl}`; // ✅ 추가

      // 테스트용 로그 추가
      console.log("🔍 [CACHE] GET 요청 - 캐시 키:", cacheKey);
      console.log("🔍 [CACHE] GET 요청 - 캐시 인덱스 키:", cacheIndexKey);
      console.log("🔍 [CACHE] 전체 URL:", req.originalUrl);
      console.log("🔍 [CACHE] 쿼리 파라미터:", req.query);

      // Redis에서 캐시된 데이터 확인
      const cachedData = await redis.get(cacheKey);

      const allKeys = await redis.keys("cache:*");
      console.log("🔍 [INVALIDATE] Redis에 저장된 모든 캐시 키:", allKeys);

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

      res.on("finish", async () => {
        try {
          // 1. 응답 데이터를 Redis에 캐시 (TTL 설정)
          console.log("💾 [CACHE] 데이터를 캐시에 저장:", cacheKey, "TTL:", ttl);
          await redis.setex(cacheKey, ttl, JSON.stringify(res.locals._cacheData));

          // 2. ✅ 캐시 키 인덱싱
          await redis.sadd(cacheIndexKey, cacheKey);
        } catch (e) {
          console.error("❌ [CACHE] 저장 실패:", e);
        }
      });

      res.locals._cacheData = null;

      res.json = function (data: any): Response {
        res.locals._cacheData = data;
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
export const invalidateCache = (indexUrls: string[] | string | null = null) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targets: string[] = [];

      if (Array.isArray(indexUrls)) {
        targets.push(...indexUrls);
      } else if (typeof indexUrls === "string") {
        targets.push(indexUrls);
      } else {
        console.warn("⚠️ [INVALIDATE] indexUrl이 지정되지 않아 캐시 무효화를 건너뜀");
        return next();
      }

      for (const indexUrl of targets) {
        const indexKey = `cache_index:${indexUrl}`;

        // ✅ 캐시 인덱싱된 키들 조회
        const keysToDelete = await redis.smembers(indexKey);

        console.log(`🔍 [INVALIDATE] 캐시 인덱스 키: ${indexKey}`);
        console.log(`🔍 [INVALIDATE] 캐시 인덱스 키에 매핑된 키들:`, keysToDelete);

        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete); // 캐시 삭제
          await redis.del(indexKey); // 인덱스 자체도 제거

          console.log(`✅ [INVALIDATE] ${keysToDelete.length}개의 키 삭제 완료`);
        } else {
          console.log(`⚠️ [INVALIDATE] '${indexKey}'에 해당하는 캐시 없음`);
        }
      }

      // 디버깅: 전체 캐시 키 확인
      const allKeys = await redis.keys("cache:*");
      console.log("🔍 [INVALIDATE] Redis에 저장된 모든 캐시 키:", allKeys);

      next();
    } catch (error) {
      console.error("❌ [INVALIDATE] 캐시 무효화 중 에러:", error);
      next();
    }
  };
};
