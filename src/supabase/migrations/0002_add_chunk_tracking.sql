-- 청크 처리 진행 상태 추적 컬럼 추가 (process_link_v2용)
ALTER TABLE public.links
ADD COLUMN IF NOT EXISTS total_chunks INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_chunk_index INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS chunk_results JSONB DEFAULT '[]'::jsonb;

-- 설명:
-- total_chunks: 전체 청크 개수 (영상 길이 / 5분)
-- current_chunk_index: 마지막으로 완료한 청크 인덱스
-- chunk_results: 각 청크의 추출 결과 임시 저장 (최종 병합 전)

