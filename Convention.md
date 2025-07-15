# Team Convention Guidelines

---

## 1. 프론트엔드 컨벤션

### 1.1. 네이밍 컨벤션

- **폴더**: **케밥 케이스** 사용 (예: `user-profiles`, `auth-context`)
- **파일**: **카멜 케이스** 사용 (예: `userProfile.tsx`)
    - **컴포넌트 파일**: 컴포넌트 이름과 일치하는 **파스칼 케이스** 사용 (예: `UserCard.tsx`, `ProductList.tsx`)
    - **유틸리티/헬퍼 파일**: **카멜 케이스** 사용 (예: `form.util.ts`)
- **컴포넌트 이름**: **파스칼 케이스** 사용 (예: `UserProfile`, `CommentList`)
    - **페이지 컴포넌트**: `<경로이름>Page` 접미사 사용 (예: `/app/community/page.tsx`의 경우 `CommunityPage`)TypeScript
        
        # 
        
        `// app/community/page.tsx
        export default function CommunityPage() {
          return <div>커뮤니티 메인 페이지</div>;
        }`
        
- **변수/Props**: **카멜 케이스** 사용 (예: `firstName`, `isLoading`)
    - **React 상태 변수 (useState)**: 명사형 **카멜 케이스** (예: `userName`, `count`)
        - 설정자 (`setState` 함수): `set` 접두사 (예: `setUserName`, `setCount`)
    - **Boolean 변수**: `is`, `has`, `can` 등의 접두사 (예: `isLoading`, `hasError`)
    - **이벤트 핸들러**: `handle` 접두사 (예: `handleClick`, `handleSubmit`)
    - **useRef 객체**: `Ref` 접미사 (예: `inputRef`, `scrollRef`)
- **타입/인터페이스**: **파스칼 케이스** 사용 (예: `UserType`, `PostProps`)
    - **타입 별칭(Type Alias)**: `T` 접두사 + **파스칼 케이스** (예: `TUser`, `TPostProps`)
- **상수**: **밑줄로 구분된 대문자** (예: `API_URL`, `DEFAULT_THEME`)
- **커스텀 Hook**: `use` 접두사로 시작 (예: `useAuth`, `useFormInput`)
- **함수**: **카멜 케이스** 사용 (예: `calculateTotal`, `formatDate`)
    - **동사로 시작**하도록 명명
    - **이벤트 핸들러**: `handle` 접두사 (예: `handleSubmitClick`)
    - **커스텀 훅**: `use` 접두사 (예: `useFetchData`)
    - **Context Provider 함수**: `provide` 접두사 사용 가능 (예: `provideUserContext`)

### 1.2. 에셋 컨벤션

- **이미지 파일**: **WebP** 형식으로 다운로드
- **아이콘**: **SVG** 형식으로 다운로드
- **아이콘/이미지 파일 네이밍**: `_` (언더스코어) 활용 (예: `user_profile_icon.svg`, `main_banner_image.webp`)

### 1.3. 코드 구조 및 원칙

- **단일 책임 원칙**: 함수는 단일 책임, 하나의 컴포넌트 = 하나의 파일
- **페이지 컴포넌트**: 반드시 `...Page` 접미사 붙이기
- **공용 컴포넌트**: 각 페이지 폴더 내 `_components` 디렉토리에서 관리
- **Props 명시**: 컴포넌트 props는 반드시 명시
- **화살표 함수**: 모든 함수는 **화살표 함수**로 작성
- **`export` 방식**: 각 함수마다 `export`를 붙이지 않고, 파일 하단에서 `export default`로 한꺼번에 내보내기

### 1.4. 타입스크립트 컨벤션

- **타입 선언**: `type` alias만 사용 (`interface` 사용 금지)
- **타입 파일 관리**: `src/types` 디렉토리 안에서 통합 관리TypeScript
    - **타입 파일 이름**: `[컴포넌트이름].types.ts`
    - **타입 이름**: `T[컴포넌트이름]Props` (예: `TTextAreaProps`)
    
    # 
    
    `// 📁 src/types/TextArea.types.ts
    export type TTextAreaProps = {
      placeholder?: string;
      value?: string;
      onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    };
    
    // 📁 src/components/TextArea/index.tsx
    import { TTextAreaProps } from "@/types/TextArea.types";
    
    const TextArea = ({ placeholder, value, onChange }: TTextAreaProps) => {
      return (
        <textarea
          placeholder={placeholder || "메시지를 입력해주세요"}
          value={value}
          onChange={onChange}
          className="w-[570px] h-40 p-6 bg-white rounded-sm border border-neutral-300 text-base text-neutral-800 resize-none focus:outline focus:outline-2 focus:outline-blue-400 placeholder:text-neutral-400"
        />
      );
    };
    export default TextArea;`
    

### 1.5. 스타일링 및 반응형

- **반응형 디자인**: **모바일 퍼스트** 원칙 (모바일, 태블릿, PC 순서로 개발)
- **CSS 프레임워크**: **Tailwind CSS** 사용
- **CSS 클래스 조건부 적용**: `clsx` 라이브러리 활용

---

## 2. 백엔드 컨벤션

### 2.1. Prisma ORM 네이밍 컨벤션

- **모델**: **파스칼 케이스** 단수 명사 (예: `User`, `Post`, `Comment`)
- **필드**: **카멜 케이스** (예: `firstName`, `createdAt`, `userId`)
- **열거형(Enum)**: **파스칼 케이스** (예: `Role`, `PostStatus`)
- **열거형 값**: 일반적으로 **밑줄로 구분된 대문자** (예: `ADMIN`, `USER_BASIC`)
- **관계**: **카멜 케이스**, 관련 모델 반영 (예: `User` 모델 내의 게시물을 위한 `posts` 필드)

### 2.2. 디렉토리별 파일명 규칙

- **`middlewares`**: `[기능].middleware.ts` (예: `errorHandler.middleware.ts`)
- **`routes`**: `[기능].route.ts` (예: `auth.route.ts`)
- **`controllers`**: `[기능].controller.ts` (예: `auth.controller.ts`)
- **`services`**: `[기능].service.ts` (예: `auth.service.ts`)
- **`repositories`**: `[기능].repository.ts` (예: `auth.repository.ts`)
    - 이름이 길어지는 경우 **카멜 케이스** 사용

### 2.3. 함수 생성, Import, Export 컨벤션

- **함수 정의 스타일**:
    - `controller`, `service`, `repository`, `middleware`: **화살표 함수**
- **Import / Export 방식**:TypeScript
    - 각 함수마다 `export`를 붙이지 않고, 파일 최하단에서 `export default`로 모든 함수를 한꺼번에 내보내기.
    
    # 
    
    `// src/services/auth.service.ts
    const login = async (email, password) => { /* ... */ };
    const register = async (email, password) => { /* ... */ };
    
    export default {
      login,
      register,
    };
    
    // src/controllers/auth.controller.ts
    import authService from '../services/auth.service.js';
    
    export const loginController = async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json(result);
      } catch (err) {
        res.status(401).json({ message: err.message });
      }
    };`
    

### 2.4. 에러 핸들링 컨벤션

- **에러 핸들러 정의**: `ErrorRequestHandler` 타입 사용TypeScript
    
    # 
    
    `import { ErrorRequestHandler } from "express";
    
    const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
      const status = error.code ?? 500;
      res.status(status).json({
        path: req.path,
        method: req.method,
        message: error.message ?? "예상치 못한 오류가 발생했습니다.",
        data: error.data ?? undefined,
        date: new Date(),
      });
    }
    export default errorHandler;`
    
- **커스텀 에러 타입**: `AppError`를 기본으로 하는 클래스 상속
    - `BadRequestError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `ServerError` 등 상황별 에러 클래스 사용
- **에러 처리**: 비즈니스 로직 내에서 `throw new [CustomError]("메시지");` 형태로 처리TypeScript
    
    # 
    
    `if (!order) {
      throw new NotFoundError("해당 주문 내역을 찾을 수 없습니다.");
    }`
    

### 2.5. Repository 레벨의 트랜잭션 처리 (Prisma)

- **함수 시그니처**: `tx?: Prisma.TransactionClient`를 선택적 매개변수로 추가
- **클라이언트 선택**: `const client = tx || prisma;`를 통해 트랜잭션 클라이언트 또는 기본 `prisma` 인스턴스 사용
- **Service 레벨 사용 예시**:TypeScript
    
    # 
    
    `import productRepository from './path'
    const createProduct = async (input) => {
      return await prisma.$transaction((tx) => {
        await productRepository.createProduct(input, tx)
      })
    }`
    

### 2.6. DTO (Data Transfer Object) 사용

- **목적**: 유저에게서 받아오는 값의 형 명시
- **위치**: `src/dtos` 디렉토리
- **네이밍 규칙**: `export type`으로 `T[이름]Dto` 형식 (`interface` 사용 금지)TypeScript
    
    # 
    
    `// dtos/create-product.dto.ts
    export type TCreateProductDto = {
      name: string;
      price: number;
    };`
    

### 2.7. Controller 작성 규칙

- **형변환**: `parseNumberOrThrow` 유틸리티 함수 사용TypeScript
    
    # 
    
    `// utils/parseNumberOrThrow.ts
    export function parseNumberOrThrow(value: string | undefined, fieldName: string): number {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        throw new Error(`${fieldName} must be a number`);
      }
      return parsed;
    }
    // 컨트롤러 사용 예시:
    import { parseNumberOrThrow } from '@/utils/parseNumberOrThrow';
    const productId = parseNumberOrThrow(req.params.id, 'productId');`
    
- **유저 인풋 타입 명시**: DTO를 사용하여 요청 데이터 구조 명확히TypeScript
    
    # 
    
    `import { TCreateProductDto } from '@/dtos/create-product.dto';
    
    const { name, price }: TCreateProductDto = req.body;`
    
- **`RequestHandler` 사용**: `req`, `res`, `next` 타입 명시 및 화살표 함수 형태로 작성TypeScript
    
    # 
    
    `import { RequestHandler } from 'express';
    
    export const createProductController: RequestHandler = async (req, res, next) => {
      try {
        // 컨트롤러 로직
        res.status(201).json({ message: 'Product created' });
      } catch (err) {
        next(err);
      }
    };`
    

### 2.8. API 명세 및 응답 컨벤션

- **`DELETE` 요청 처리**:HTTP
    - 성공 시 **HTTP 상태 코드 200 (OK)** 반환
    - 응답 본문에 **처리 결과 메시지** 포함
    
    # 
    
    `DELETE /companies/123
    
    HTTP/1.1 200 OK
    Content-Type: application/json
    
    {
      "message": "[xx]가 성공적으로 처리 되었습니다",
    }`
    

---

## 3. 협업 컨벤션

### 3.1. Git 브랜치 네이밍

- **`Git Flow_Merge`** 방식 사용
- **브랜치 이름**: `feat/` 접두사 + 기능 이름 (예: `feat/landing`, `feat/auth`, `feat/modal`, `feat/product`, `feat/invite`, `feat/cart-[세부기능]`)

### 3.2. PR (Pull Request) 컨벤션

- **PR 주기**: 하루에 한 번, **오후 1시**에 PR 리뷰 & 머지 시간 가짐 (긴급한 경우 유연하게 조정 가능)
- **PR 제목**: 커밋 메시지와 동일 또는 여러 커밋인 경우 `commit title: 내용` + `[자기이름]` (항상 마지막에 붙이기)
- **Label**: 이슈와 연관된 Label 선택
- **Assignee**: 본인 지정
- **Reviewer**: 미리 정해진 코딩 페어 파트너 1명 지정 (김홍섭-이지수, 이태빈-장원빈, 김우주-조성빈)
- **PR 작성 후 할 일**:
    - 3팀 디스코드 PR 채널에 리뷰어 `@` 태그하여 PR 리뷰 요청 메시지 보내기
- **PR 리뷰어 역할**:
    - 요청 온 메시지에 ✅ 체크 이모지로 리액션 남겨 리뷰 중임을 알림.
    - `Files changed` 탭에서 코멘트 달기.
    - **승인 기준**:
        - **즉시 승인**: 고칠 내용이 없고, 개선점/제안만 있는 경우. 팀원에게 리뷰 완료 알림.
        - **수정 요청**: 팀 컨벤션에 어긋나는 경우 코멘트 달아 안내 후, 팀원이 수정하면 승인.
    - **리뷰 완료 후**: **리뷰해준 사람의 브랜치 삭제** 후, 3팀 디스코드 PR 채널에 머지 완료되었다고 댓글로 알리기.

---

## 4. 기타 설정 및 도구

### 4.1. Prettier 설정 (`.prettierrc`)

JSON

# 

`{
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "bracketSpacing": true,
  "trailingComma": "all"
}`

- **`printWidth`**: 한 줄 최대 120자 허용
- **`tabWidth`**: 들여쓰기 2칸 (공백)
- **`useTabs`**: 탭 대신 공백 사용 (`false`)
- **`semi`**: 문장 끝에 항상 세미콜론(;) 붙이기 (`true`)
- **`singleQuote`**: 문자열을 `"` (큰따옴표)로 감싸기 (`false`)
- **`bracketSpacing`**: 객체 리터럴 중괄호 안쪽에 공백 추가 (`true`)
- **`trailingComma`**: 가능한 모든 위치에 쉼표 붙이기 (`all`)

### 4.2. Next.js 팩

- **Turbo Pack** 사용

### 4.3. Import 경로

- **원거리**: **절대 경로** 사용 (예: `@/components/Button`)
- **근거리**: **상대 경로** 사용 (예: `../utils/helpers`)
- **기준**: 현재 시점 기준으로 멀다면 무조건 절대 경로 적용.