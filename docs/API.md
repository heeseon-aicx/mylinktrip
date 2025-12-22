# 🔗 MyLinkTrip API 문서

## 개요

유튜브 여행 영상을 분석하여 장소 정보를 추출하는 API입니다.

## Base URL

```
개발: http://localhost:3000/api
프로덕션: https://mylinktrip.vercel.app/api
```

---

## 📋 엔드포인트 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/links` | 링크 생성 |
| `GET` | `/links/:id` | 링크 상세 조회 |
| `GET` | `/links/:id/items/:itemId` | 아이템 단일 조회 |
| `PATCH` | `/links/:id/items/:itemId` | 아이템 수정 |
| `DELETE` | `/links/:id/items/:itemId` | 아이템 삭제 |
| `PATCH` | `/links/:id/items/reorder` | 순서 일괄 변경 |

---

## 🔷 Links API

### POST /api/links

유튜브 URL을 입력받아 새로운 링크를 생성합니다.

**Request**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=xxxxx"
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "youtube_url": "https://www.youtube.com/watch?v=xxxxx",
  "youtube_video_id": "xxxxx",
  "youtube_channel_name": null,
  "youtube_channel_id": null,
  "title_ai": null,
  "title_user": null,
  "status": "PENDING",
  "progress_pct": 0,
  "stage": null,
  "status_message": "분석 대기 중...",
  "error_code": null,
  "error_message": null,
  "error_detail": null,
  "started_at": null,
  "finished_at": null,
  "parsed_at": null,
  "heartbeat_at": null,
  "created_at": "2024-12-22T10:00:00.000Z",
  "updated_at": "2024-12-22T10:00:00.000Z"
}
```

**Errors**
| Status | Code | Message |
|--------|------|---------|
| 400 | `MISSING_URL` | youtube_url은 필수입니다 |
| 400 | `INVALID_URL` | 유효하지 않은 유튜브 URL입니다 |
| 500 | `CREATE_FAILED` | 링크 생성에 실패했습니다 |

---

### GET /api/links/:id

링크 상세 정보와 장소 아이템 목록을 조회합니다.

**Response** `200 OK`
```json
{
  "id": 1,
  "youtube_url": "https://www.youtube.com/watch?v=xxxxx",
  "youtube_video_id": "xxxxx",
  "youtube_channel_name": "여행에미치다",
  "youtube_channel_id": "UC1234567890",
  "title_ai": "도쿄 3박4일 완벽 가이드",
  "title_user": null,
  "status": "READY",
  "progress_pct": 100,
  "stage": null,
  "status_message": "분석 완료!",
  "error_code": null,
  "error_message": null,
  "error_detail": null,
  "started_at": "2024-12-22T10:00:00.000Z",
  "finished_at": "2024-12-22T10:02:00.000Z",
  "parsed_at": "2024-12-22T10:02:00.000Z",
  "heartbeat_at": null,
  "created_at": "2024-12-22T10:00:00.000Z",
  "updated_at": "2024-12-22T10:02:00.000Z",
  "link_place_items": [
    {
      "id": 1,
      "link_id": 1,
      "place_name": "이치란 라멘 시부야점",
      "category": "TNA",
      "country": "일본",
      "city": "도쿄",
      "timeline_start_sec": 125,
      "timeline_end_sec": 180,
      "youtuber_comment": "웨이팅 1시간은 각오하세요!",
      "user_memo": null,
      "order_index": 0,
      "is_deleted": false,
      "created_at": "2024-12-22T10:02:00.000Z",
      "updated_at": "2024-12-22T10:02:00.000Z"
    }
  ]
}
```

**Errors**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_ID` | 유효하지 않은 ID입니다 |
| 404 | `NOT_FOUND` | 링크를 찾을 수 없습니다 |
| 500 | `FETCH_FAILED` | 링크 조회에 실패했습니다 |

---

## 🔷 Items API

### GET /api/links/:id/items/:itemId

장소 아이템 단일 조회

**Response** `200 OK`
```json
{
  "id": 1,
  "link_id": 1,
  "place_name": "이치란 라멘 시부야점",
  "category": "TNA",
  "country": "일본",
  "city": "도쿄",
  "timeline_start_sec": 125,
  "timeline_end_sec": 180,
  "youtuber_comment": "웨이팅 1시간은 각오하세요!",
  "user_memo": null,
  "order_index": 0,
  "is_deleted": false,
  "created_at": "2024-12-22T10:02:00.000Z",
  "updated_at": "2024-12-22T10:02:00.000Z"
}
```

---

### PATCH /api/links/:id/items/:itemId

장소 아이템 수정 (사용자 메모, 순서, 삭제 상태만 수정 가능)

**Request**
```json
{
  "user_memo": "예약 필수!",
  "order_index": 2,
  "is_deleted": false
}
```

> ⚠️ 최소 하나의 필드는 포함되어야 합니다.

**Response** `200 OK`
```json
{
  "id": 1,
  "link_id": 1,
  "place_name": "이치란 라멘 시부야점",
  "category": "TNA",
  "country": "일본",
  "city": "도쿄",
  "timeline_start_sec": 125,
  "timeline_end_sec": 180,
  "youtuber_comment": "웨이팅 1시간은 각오하세요!",
  "user_memo": "예약 필수!",
  "order_index": 2,
  "is_deleted": false,
  "created_at": "2024-12-22T10:02:00.000Z",
  "updated_at": "2024-12-22T10:05:00.000Z"
}
```

**Errors**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_ID` | 유효하지 않은 ID입니다 |
| 400 | `NO_UPDATE_FIELDS` | 수정할 필드가 없습니다 |
| 500 | `UPDATE_FAILED` | 아이템 수정에 실패했습니다 |

---

### DELETE /api/links/:id/items/:itemId

장소 아이템 삭제 (Soft Delete)

**Response** `200 OK`
```json
{
  "success": true
}
```

**Errors**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_ID` | 유효하지 않은 ID입니다 |
| 500 | `DELETE_FAILED` | 아이템 삭제에 실패했습니다 |

---

### PATCH /api/links/:id/items/reorder

장소 순서 일괄 변경

**Request**
```json
{
  "item_orders": [
    { "id": 2, "order_index": 0 },
    { "id": 1, "order_index": 1 },
    { "id": 3, "order_index": 2 }
  ]
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "updated_count": 3
}
```

**Errors**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_ID` | 유효하지 않은 ID입니다 |
| 400 | `INVALID_BODY` | item_orders 배열이 필요합니다 |
| 400 | `INVALID_ITEM` | 각 아이템은 id와 order_index가 필요합니다 |
| 500 | `REORDER_FAILED` | 순서 변경에 실패했습니다 |

---

## 📊 상태 값 (Enums)

### LinkStatus
| 값 | 설명 |
|---|------|
| `PENDING` | 분석 대기 중 |
| `PROCESSING` | 분석 진행 중 |
| `READY` | 분석 완료 |
| `FAILED` | 분석 실패 |

### LinkStage
| 값 | 설명 | 진행률 |
|---|------|-------|
| `fetch_meta` | 영상 정보 가져오는 중 | ~10% |
| `transcribe` | 자막 추출 중 | ~40% |
| `extract_places` | 장소 추출 중 | ~70% |
| `summarize` | 여행 계획 생성 중 | ~95% |

### PlaceCategory
| 값 | 설명 |
|---|------|
| `TNA` | 티켓/관광지/투어 |
| `LODGING` | 숙소 |

---

## 🔄 Realtime 사용법

Supabase Realtime을 사용하여 링크 상태 변경을 실시간으로 수신합니다.

```typescript
import { useLinkRealtime } from "@/hooks/useLinkRealtime";

function LinkPage({ linkId }: { linkId: number }) {
  const { link, isLoading, isSubscribed, error } = useLinkRealtime(linkId, {
    immediate: true,           // 즉시 초기 데이터 fetch
    unsubscribeOnComplete: true // READY/FAILED면 구독 해제
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  
  return (
    <div>
      <p>상태: {link?.status} {isSubscribed && "🟢 실시간 연결됨"}</p>
      <p>진행률: {link?.progress_pct}%</p>
      <p>{link?.status_message}</p>
      
      {link?.status === "READY" && (
        <ul>
          {link.link_place_items.map(item => (
            <li key={item.id}>{item.place_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Realtime 동작 방식

```
1. createLink() 호출 → id 반환
2. useLinkRealtime(id) → 초기 데이터 fetch + 구독 시작
3. 백그라운드에서 AI 분석 진행 → links 테이블 UPDATE
4. Realtime이 변경 감지 → 자동으로 UI 업데이트
5. status가 READY/FAILED → 구독 해제 (옵션)
```

---

## 📁 파일 구조

```
src/
├── app/api/
│   └── links/
│       ├── route.ts                    # POST /api/links
│       └── [id]/
│           ├── route.ts                # GET /api/links/:id
│           └── items/
│               ├── reorder/
│               │   └── route.ts        # PATCH reorder
│               └── [itemId]/
│                   └── route.ts        # GET, PATCH, DELETE
├── lib/services/
│   └── links.server.ts                 # 서버 사이드 서비스
├── services/
│   └── links.ts                        # 클라이언트 사이드 서비스
├── hooks/
│   ├── useLinkRealtime.ts              # Realtime 훅 ⭐
│   └── useLinkPolling.ts               # 폴링 훅 (대체용)
├── types/
│   └── database.ts                     # DB 타입
└── mocks/
    └── data.ts                         # 더미 데이터
```

