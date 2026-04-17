import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// ブロック順次表示スライド（画像切り替え方式 + フェードイン）
// Puppeteerで撮った段階的スクショを、ナレーションタイミングでフェードイン切り替え

const FADE_DURATION = 8; // フェードインのフレーム数

interface BlockStep {
  image: string; // staticFileパス（例: "slides/blocks/slide-08-title.png"）
  appearFrame: number; // この画像に切り替わるフレーム
}

interface SlideBlockRevealProps {
  steps: BlockStep[];
}

export const SlideBlockReveal: React.FC<SlideBlockRevealProps> = ({ steps }) => {
  const frame = useCurrentFrame();

  // 現在のフレームに該当するステップを逆順で検索（最後にマッチしたものが最新）
  let activeIndex = 0;
  for (let i = 0; i < steps.length; i++) {
    if (frame >= steps[i].appearFrame) {
      activeIndex = i;
    }
  }

  const activeStep = steps[activeIndex];

  // フェードインのopacity計算（最初のステップはフェードなし）
  const fadeOpacity = activeIndex === 0
    ? 1
    : interpolate(
        frame,
        [activeStep.appearFrame, activeStep.appearFrame + FADE_DURATION],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

  return (
    <AbsoluteFill style={{ zIndex: 0 }}>
      {/* 前のステップの画像（フェード中の下地） */}
      {activeIndex > 0 && (
        <Img
          src={staticFile(steps[activeIndex - 1].image)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {/* アクティブな画像（フェードイン） */}
      <Img
        src={staticFile(activeStep.image)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeOpacity,
        }}
      />
      {/* 残りの画像をプリロード（非表示） */}
      {steps.map((step) =>
        step.image !== activeStep.image &&
        step.image !== steps[Math.max(0, activeIndex - 1)]?.image ? (
          <Img
            key={step.image}
            src={staticFile(step.image)}
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              opacity: 0,
            }}
          />
        ) : null,
      )}
    </AbsoluteFill>
  );
};
