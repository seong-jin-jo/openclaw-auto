-- 숏폼 공장 실행에 울타리 표를 둔다.
-- 표가 없으면 강제 종료된 실행의 옛 worker 가 살아남아 비용 작업을 계속 만들고,
-- 끝날 때 failed 로 닫힌 실행을 succeeded 로 덮어쓴다.
BEGIN;

ALTER TABLE shorts_factory_runs
  ADD COLUMN IF NOT EXISTS lease_token UUID;

-- 이미 끝난 실행은 표를 가질 필요가 없다. 진행 중인 실행은 다음 heartbeat 에서
-- 표가 없음을 확인하고 스스로 물러난다. 표를 소급 발급하면 안 된다.

COMMIT;
