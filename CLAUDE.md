@AGENTS.md

# 커밋 규칙 (Conventional Commits)

형식: `<type>(<scope>): <요약>`

- `type`: `feat`(기능) · `fix`(버그) · `style`(디자인·스타일, 동작 변화 없음) · `refactor` · `docs` · `chore`(설정·의존성) · `test`
- `scope`: 선택. 바뀐 영역 (예: `landing`, `theme`)
- 요약은 한국어 명령형, 50자 이내, 끝에 마침표 없음
- 본문(선택)은 한 줄 띄우고 "왜"를 적는다
- 한 커밋에는 한 가지 목적만 담는다

예: `style(landing): 히어로 섹션 그라데이션 배경 적용`
