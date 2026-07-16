import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { NormalizedLandmark } from '../types';

interface Props {
  imageElement: HTMLImageElement;
  landmarks: NormalizedLandmark[];
  progressRef: React.MutableRefObject<number>;
  onMouthPositionUpdate: (pos: { x: number, y: number }) => void;
}

const PixiFaceWarp: React.FC<Props> = ({ imageElement, landmarks, progressRef, onMouthPositionUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !imageElement) return;

    const app = new PIXI.Application({
      backgroundAlpha: 0,
      resizeTo: containerRef.current,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    containerRef.current.appendChild(app.view as unknown as HTMLElement);

    let mesh: PIXI.Mesh;
    let baseVertices: Float32Array;
    const faceMask = new PIXI.Graphics();
    const mouthHole = new PIXI.Graphics(); // 입 안의 리얼한 블랙홀

    const initPixi = async () => {
      // 확실하게 이미지를 브라우저 메모리에 디코딩하여 흰 바탕 오류를 원천 차단합니다.
      const img = new Image();
      img.src = imageElement.src;
      await img.decode();

      const texture = PIXI.Texture.from(img);

      const containerW = containerRef.current!.clientWidth;
      const containerH = containerRef.current!.clientHeight;
      const imgRatio = texture.width / texture.height;
      const containerRatio = containerW / containerH;

      let drawW = containerW;
      let drawH = containerW / imgRatio;
      if (imgRatio <= containerRatio) {
        drawH = containerH;
        drawW = containerH * imgRatio;
      }

      // 부드러운 왜곡을 위한 고해상도 메쉬(40x40)
      const segmentsX = 40;
      const segmentsY = 40;
      const vertices: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let y = 0; y <= segmentsY; y++) {
        for (let x = 0; x <= segmentsX; x++) {
          const u = x / segmentsX;
          const v = y / segmentsY;
          vertices.push(u * drawW, v * drawH);
          uvs.push(u, v);
        }
      }

      for (let y = 0; y < segmentsY; y++) {
        for (let x = 0; x < segmentsX; x++) {
          const v1 = y * (segmentsX + 1) + x;
          const v2 = v1 + 1;
          const v3 = (y + 1) * (segmentsX + 1) + x;
          const v4 = v3 + 1;
          indices.push(v1, v2, v3);
          indices.push(v2, v4, v3);
        }
      }

      const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', vertices, 2)
        .addAttribute('aTextureCoord', uvs, 2)
        .addIndex(indices);

      const material = new PIXI.MeshMaterial(texture);
      mesh = new PIXI.Mesh(geometry, material);
      mesh.x = (containerW - drawW) / 2;
      mesh.y = (containerH - drawH) / 2;
      
      app.stage.addChild(mesh);
      
      // 얼굴 윤곽선(Oval) 좌표를 이용해 얼굴만 동그랗게 오려내는 마스크(Mask) 적용
      const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
      app.stage.addChild(faceMask);
      mesh.mask = faceMask;

      // 블랙홀(입 안) 렌더링을 위해 최상단에 추가
      app.stage.addChild(mouthHole);

      baseVertices = new Float32Array(vertices);

      const mouthCenterNormalized = landmarks[14];
      const mouthLocalX = mouthCenterNormalized.x * drawW;
      const mouthLocalY = mouthCenterNormalized.y * drawH;
      
      const rect = containerRef.current!.getBoundingClientRect();
      onMouthPositionUpdate({
        x: rect.left + mesh.x + mouthLocalX,
        y: rect.top + mesh.y + mouthLocalY
      });

      // 애니메이션 루프 시작
      app.ticker.add(() => {
        if (!mesh || !baseVertices) return;

        const p = progressRef.current;
        const buffer = mesh.geometry.getBuffer('aVertexPosition');
        const data = buffer.data as unknown as Float32Array; 

        const topLip = landmarks[13];
        const bottomLip = landmarks[14];
        const jaw = landmarks[152];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];

        const cx = ((topLip.x + bottomLip.x) / 2) * drawW;
        const cy = ((topLip.y + bottomLip.y) / 2) * drawH;
        
        const faceWidth = Math.abs(rightCheek.x - leftCheek.x) * drawW;
        const faceHeight = Math.abs(jaw.y - topLip.y) * drawH;
        
        const radius = faceWidth * 0.9;

        // 1. 얼굴 윤곽선 마스크 동적 렌더링 (턱이 내려갈 때 얼굴이 잘리지 않도록 확장)
        faceMask.clear();
        faceMask.beginFill(0xffffff);
        faceOvalIndices.forEach((index, i) => {
          const lm = landmarks[index];
          let px = mesh.x + lm.x * drawW;
          let py = mesh.y + lm.y * drawH;
          
          // 입이 벌어질 때 아랫턱 윤곽선도 같이 부드럽게 늘려줍니다.
          if (lm.y > bottomLip.y) {
            py += p * faceHeight * 0.45;
          }
          if (p > 0) {
            if (lm.x < cx / drawW) px -= p * faceWidth * 0.1;
            else px += p * faceWidth * 0.1;
          }
          
          if (i === 0) faceMask.moveTo(px, py);
          else faceMask.lineTo(px, py);
        });
        faceMask.closePath();
        faceMask.endFill();

        // 2. 리얼 블랙홀 입 렌더링 (늘어난 피부 사이의 빈 공간을 검게 채움)
        mouthHole.clear();
        if (p > 0) {
          mouthHole.beginFill(0x000000);
          const holeW = faceWidth * 0.08 + p * faceWidth * 0.35;
          const holeH = faceHeight * 0.02 + p * faceHeight * 0.45;
          mouthHole.drawEllipse(mesh.x + cx, mesh.y + cy, holeW, holeH);
          mouthHole.endFill();
        }

        // 변화가 없을 경우 초기 상태 복구 및 리턴
        if (p === 0) {
          let isChanged = false;
          for (let i = 0; i < data.length; i++) {
            if (data[i] !== baseVertices[i]) {
              data[i] = baseVertices[i];
              isChanged = true;
            }
          }
          if (isChanged) buffer.update();
          return;
        }

        // 3. 피부 왜곡(Warp) 연산 - 픽셀을 입 중심에서부터 바깥쪽으로 강력하게 밀어냅니다.
        for (let i = 0; i < data.length; i += 2) {
          let bx = baseVertices[i];
          let by = baseVertices[i + 1];

          const dx = bx - cx;
          const dy = by - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius) {
            let falloff = Math.max(0, 1 - (dist / radius));
            falloff = falloff * falloff * (3 - 2 * falloff);

            // 픽셀을 중앙(블랙홀)에서부터 바깥으로 거세게 밀어냅니다.
            bx += dx * p * 2.0 * falloff;
            by += dy * p * 2.0 * falloff;

            // 턱은 밑으로 더 과장되게 잡아당김
            if (dy > 0) {
              by += p * faceHeight * 0.5 * falloff;
            }
          }

          data[i] = bx;
          data[i + 1] = by;
        }

        buffer.update();
      });
    };

    initPixi();

    return () => {
      app.destroy(true, { children: true });
    };
  }, [imageElement, landmarks, onMouthPositionUpdate, progressRef]);

  return <div ref={containerRef} className="w-full h-full relative z-20 drop-shadow-2xl" />;
};

export default PixiFaceWarp;