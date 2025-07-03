# Express TypeScript Backend Project

이 프로젝트는 Express, TypeScript, Swagger, MVC 패턴, 그리고 Prisma를 사용하여 구축된 백엔드 애플리케이션입니다.

## 🚀 프로젝트 시작하기

### 1. 프로젝트 초기 설정

다음 명령어를 순서대로 실행하여 프로젝트를 초기화하고 필요한 의존성을 설치합니다.

```
# 1. 프로젝트 폴더 생성 및 이동
mkdir express-typescript-backend
cd express-typescript-backend

# 2. npm 프로젝트 초기화
npm init -y

# 3. Express 및 TypeScript 관련 패키지 설치
npm install express typescript
npm install -D @types/express @types/node ts-node nodemon

# 4. TypeScript 설정 파일 (tsconfig.json) 생성
npx tsc --init

# 5. 환경 변수 관리를 위한 dotenv 패키지 설치
npm install dotenv

# 6. Swagger (API 문서화) 관련 패키지 설치
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-ui-express @types/swagger-jsdoc

# 7. Prisma ORM 관련 패키지 설치
npm install prisma @prisma/client
npm install -D prisma

# 8. Prisma 초기화 (prisma 폴더 및 schema.prisma 파일 생성)
npx prisma init

# 9. Prisma Client 생성 (schema.prisma 기반으로 타입 정의 및 클라이언트 코드 생성)
# 이 명령은 schema.prisma 파일이 변경될 때마다 다시 실행해야 합니다.
npx prisma generate

```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가합니다. (DB URL은 나중에 실제 값으로 변경해야 합니다.)

```
# .env (프로젝트 루트에 생성)

# 서버 포트
PORT=3000

# 데이터베이스 URL (Prisma에서 사용)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# JWT 비밀 키 (예시)
JWT_SECRET="your_jwt_secret_key"

```

**⚠️ 중요:** `.env` 파일은 민감한 정보를 포함하므로, **절대 Git 저장소에 커밋하지 않도록** `.gitignore`에 `.env`를 추가했는지 확인하세요.

### 3. 데이터베이스 마이그레이션 (DB URL 설정 후)

`DATABASE_URL`이 실제 데이터베이스에 연결될 수 있도록 설정된 후, 다음 명령어를 실행하여 데이터베이스 스키마를 적용합니다.

```
npx prisma migrate dev --name init

```

### 4. 프로젝트 실행

#### 개발 모드

```
npm run dev

```

개발 서버가 `http://localhost:3000`에서 실행됩니다.
Swagger API 문서는 `http://localhost:3000/api-docs`에서 확인할 수 있습니다.

#### 프로덕션 빌드 및 실행

```
npm run build
npm start

```

## 📂 프로젝트 구조

```
express-typescript-backend/
├── node_modules/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── config/
│   │   └── swagger.ts
│   ├── controllers/    # 요청 처리 및 응답 반환
│   │   └── userController.ts
│   ├── routes/         # 라우팅 정의
│   │   ├── index.ts
│   │   └── userRoutes.ts
│   ├── services/       # 비즈니스 로직 처리
│   │   └── userService.ts
│   ├── repositories/   # 데이터 접근 로직 (Prisma 사용)
│   │   └── userRepository.ts
│   └── utils/
│       └── prisma.ts   # Prisma Client 싱글톤 관리
├── .env                  # 로컬 환경 변수 (Git에 올리지 않음)
├── .gitignore
├── package.json
├── tsconfig.json
└── yarn.lock (or package-lock.json)
```
