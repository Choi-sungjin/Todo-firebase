# 할일 앱 (Firebase 버전)

이 폴더는 **Firebase Realtime Database**에 연결된 버전입니다.  
별도 저장소로 push 후 Vercel·GitHub Pages 등에 배포하면 Firebase와 연동된 할일 앱으로 동작합니다.

## 사용 방법

- `index.html`을 브라우저에서 열거나, 정적 호스팅(Vercel, GitHub Pages 등)으로 배포
- 데이터는 Firebase 콘솔 → Realtime Database에서 확인
- 오류 시: Firebase 콘솔 → Realtime Database → **규칙** 탭에서 읽기/쓰기 규칙 확인

## 루트 프로젝트와의 차이

- **루트 (`todo-firebase`)**: localhost:3000(프론트) + localhost:5000(REST API) 사용
- **이 폴더 (`TODO-FIREBASE-Git`)**: Firebase Realtime Database 사용, 백엔드 서버 불필요
