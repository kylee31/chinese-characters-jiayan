# Frontend Preparation Checklist

이 문서는 `Next.js on Vercel -> FastAPI on Cloud Run -> Jiayan -> 분석 결과(JSON)` 구조로 진행하기 전에 프론트엔드에서 미리 준비할 항목을 정리한 체크리스트입니다.

## 1. API 연동 구조

* [ ] FastAPI 호출 코드를 컴포넌트에서 분리한다.

* [ ] `fetch` 또는 API 클라이언트 함수를 `lib` 계층에 모은다.

* [ ] 분석 요청용 함수명을 정한다. 예: `analyzeText`, `requestAnalysis`

* [ ] FastAPI endpoint 경로를 임시로 정한다. 예: `POST /analyze`

* [ ] API base URL을 코드에 직접 쓰지 않고 환경변수로 관리한다.

예상 파일:

```txt
app/
lib/
  api.ts
types/
  analysis.ts
```

## 2. 환경변수

* [ ] 로컬 개발용 `.env.local`을 준비한다.

* [ ] Vercel 배포용 환경변수 이름을 정한다.

* [ ] FastAPI Cloud Run URL을 환경변수로 주입할 수 있게 만든다.

* [ ] 임시 개발 중에는 mock API URL 또는 빈 값에 대한 처리를 둔다.

예상 환경변수:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-fastapi-service.run.app
```

주의:

* 브라우저에서 직접 호출해야 하는 값은 `NEXT_PUBLIC_` prefix가 필요하다.

* secret key, private token, service account key는 `NEXT_PUBLIC_` 환경변수에 넣지 않는다.

## 3. 요청/응답 타입

* [ ] 프론트에서 FastAPI로 보낼 요청 타입을 정의한다.

* [ ] FastAPI에서 받을 JSON 응답 타입을 정의한다.

* [ ] Jiayan 분석 결과가 확정되기 전까지는 확장 가능한 타입으로 둔다.

* [ ] 에러 응답 타입도 따로 정한다.

예상 타입:

```ts
export type AnalysisRequest = {
  text: string;
};

export type AnalysisResponse = {
  result: unknown;
  raw?: unknown;
  summary?: string;
};

export type ApiErrorResponse = {
  detail?: string;
  message?: string;
};
```

## 4. 사용자 입력 UI

* [ ] 분석할 한문 텍스트 입력 영역을 만든다.

* [ ] 빈 입력 제출을 막는다.

* [ ] 너무 긴 입력에 대한 제한 또는 안내를 정한다.

* [ ] 분석 실행 버튼을 둔다.

* [ ] 요청 중에는 버튼 중복 클릭을 막는다.

* [ ] 입력값 초기화 기능이 필요한지 결정한다.

## 5. 상태 처리

* [ ] 초기 상태를 정의한다.

* [ ] 로딩 상태를 정의한다.

* [ ] 성공 상태를 정의한다.

* [ ] 실패 상태를 정의한다.

* [ ] 재시도 동작을 준비한다.

* [ ] FastAPI가 아직 없을 때 사용할 mock 상태를 준비한다.

필요한 상태 예시:

```txt
idle
loading
success
error
```

## 6. JSON 결과 출력

* [ ] 분석 결과 JSON을 보기 좋게 출력한다.

* [ ] `JSON.stringify(result, null, 2)` 형태의 pretty print를 사용한다.

* [ ] 결과가 없을 때의 빈 상태 UI를 준비한다.

* [ ] 복사 버튼이 필요한지 결정한다.

* [ ] 원본 응답과 가공된 표시 결과를 분리할지 결정한다.

## 7. FastAPI 미구현 기간의 Mock 처리

* [ ] 실제 API 대신 임시 mock 함수를 만든다.

* [ ] mock 응답 형태를 실제 FastAPI 응답 예상 구조와 최대한 맞춘다.

* [ ] mock 사용 여부를 쉽게 제거하거나 전환할 수 있게 한다.

* [ ] API 연동 전에도 UI 개발과 배포 확인이 가능하게 한다.

예상 mock 응답:

```json
{
  "result": {
    "tokens": [],
    "message": "Mock analysis result"
  }
}
```

## 8. CORS 준비

* [ ] Vercel 배포 도메인을 FastAPI CORS 허용 목록에 넣을 계획을 세운다.

* [ ] 로컬 개발 도메인도 허용해야 한다. 예: `http://localhost:3000`

* [ ] preview deployment 도메인을 어떻게 처리할지 정한다.

* [ ] CORS 설정은 FastAPI에서 처리해야 함을 백엔드 작업 목록에 남긴다.

FastAPI 쪽에서 필요할 가능성이 높은 origin:

```txt
http://localhost:3000
https://your-vercel-app.vercel.app
```

## 9. 배포 구조

* [ ] Next.js는 Vercel에 배포한다.

* [ ] FastAPI는 Cloud Run에 배포한다.

* [ ] Vercel 환경변수에 Cloud Run service URL을 등록한다.

* [ ] Cloud Run URL 변경 시 프론트 코드를 수정하지 않아도 되게 한다.

* [ ] production, preview, development 환경별 API URL 전략을 정한다.

## 10. 에러 처리

* [ ] 네트워크 오류 메시지를 준비한다.

* [ ] FastAPI 4xx 오류 메시지를 표시할 방식을 정한다.

* [ ] FastAPI 5xx 오류 메시지를 표시할 방식을 정한다.

* [ ] timeout이 필요한지 결정한다.

* [ ] JSON 파싱 실패에 대한 방어 코드를 둔다.

## 11. 보안과 민감정보

* [ ] 브라우저에 노출되면 안 되는 값은 프론트 환경변수에 넣지 않는다.

* [ ] Jiayan 실행에 필요한 서버 내부 설정은 FastAPI 또는 Cloud Run 환경변수에서 관리한다.

* [ ] 인증이 필요해질 가능성이 있다면 API 호출 레이어에서 확장 가능하게 둔다.

* [ ] 사용자 입력 텍스트를 로그에 남길지 여부를 신중히 정한다.

## 12. 향후 백엔드와 맞춰야 할 API 계약

* [ ] endpoint path

* [ ] HTTP method

* [ ] request body schema

* [ ] success response schema

* [ ] error response schema

* [ ] 최대 입력 길이

* [ ] 처리 시간 예상치

* [ ] timeout 기준

* [ ] CORS 허용 origin

* [ ] Cloud Run service URL

## 우선순위

가장 먼저 준비할 항목:

1. API 호출 레이어 분리
2. 환경변수 이름 확정
3. 요청/응답 타입 정의
4. 입력 UI와 결과 JSON 출력 UI
5. mock 응답으로 프론트 개발 가능하게 만들기

FastAPI가 준비된 뒤 연결할 항목:

1. `NEXT_PUBLIC_API_BASE_URL`에 Cloud Run URL 등록
2. 실제 `POST /analyze` endpoint 연결
3. CORS 확인
4. 실제 Jiayan 분석 결과 JSON 구조에 맞춰 타입 보정
5. Vercel production 배포 테스트

