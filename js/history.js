/*
 * 되돌리기 / 다시하기
 * ------------------------------------------------------------
 * 무언가 바뀔 때마다 "바뀌기 전 모습"을 사진처럼 한 장씩 쌓아둬요.
 * 되돌리기 = 맨 위 사진을 꺼내 그 모습으로 돌아가기
 * 다시하기 = 되돌린 걸 다시 앞으로
 */
window.HometeoHistory = function (limit) {
  const past = [];
  const future = [];
  const max = limit || 100;
  const copy = (v) => JSON.parse(JSON.stringify(v));

  return {
    // 바뀌기 직전 모습을 저장해요
    record(state, label) {
      past.push({ state: copy(state), label });
      if (past.length > max) past.shift();
      future.length = 0; // 새로 바꾸면 '다시하기'는 비워져요
    },
    undo(current) {
      if (!past.length) return null;
      const step = past.pop();
      future.push({ state: copy(current), label: step.label });
      return step;
    },
    redo(current) {
      if (!future.length) return null;
      const step = future.pop();
      past.push({ state: copy(current), label: step.label });
      return step;
    },
    // 처음부터 다시 쌓기 (새 내용을 불러왔을 때)
    clear() { past.length = 0; future.length = 0; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0
  };
};
