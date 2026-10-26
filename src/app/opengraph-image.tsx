import { ImageResponse } from "next/og";

// Romeo-N-Cupid — OG 이미지 (Chunk C5+C7)
// 디자인 lint 예외: next/og ImageResponse는 Satori 렌더러로 동작해 외부 CSS 파일·CSS 커스텀 프로퍼티(var())를 지원하지 않는다.
// 인라인 style과 하드코딩 hex/px가 이 파일에서는 유일한 방법이라 그대로 둔다.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Romeo & Cupid — Cupid가 매일 정오 한 분만 추천하는 Editorial 매거진 매칭";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6B9D 0%, #C42B6F 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 200,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          💘
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, textAlign: "center" }}>
          Romeo-N-Cupid
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 24,
            opacity: 0.95,
            fontWeight: 500,
          }}
        >
          Cupid가 매일 정오 한 분만 추천 · Editorial 매거진 매칭
        </div>
      </div>
    ),
    { ...size },
  );
}
