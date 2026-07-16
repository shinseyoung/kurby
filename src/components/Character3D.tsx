import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { NormalizedLandmark } from '../types';

interface Props {
  texture: THREE.CanvasTexture | null;
  landmarks: NormalizedLandmark[] | null;
  warpProgress: React.MutableRefObject<number>;
  onMouthPositionUpdate: (pos: { x: number, y: number }) => void;
}

export const Character3D: React.FC<Props> = ({ texture, landmarks, warpProgress, onMouthPositionUpdate }) => {
  const { scene } = useGLTF('/models/model.glb');
  const faceMeshRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null>(null);
  const bboxRef = useRef<THREE.Box3>(new THREE.Box3());
  const { camera, size } = useThree();

  // 1. 모델 초기화 및 얼굴 오버레이(Overlay) 생성
  useEffect(() => {
    const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = [];
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        meshes.push(child as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>);
      }
    });

    if (meshes.length === 0) return;

    // 타겟 메쉬 탐색
    let targetMesh = meshes.find((m) => m.name.toLowerCase().includes('face') || m.name.toLowerCase().includes('head'));
    if (!targetMesh) {
      targetMesh = meshes.find((m) => {
        const mat = Array.isArray(m.material) ? m.material[0] : m.material;
        if (mat && (mat as THREE.MeshStandardMaterial).color) {
          const { r, g, b } = (mat as THREE.MeshStandardMaterial).color;
          return r > 0.5 && g > 0.3 && b < 0.8;
        }
        return false;
      });
    }
    if (!targetMesh) targetMesh = meshes[0];

    if (targetMesh) {
      faceMeshRef.current = targetMesh;
      
      const posAttr = targetMesh.geometry.attributes.position as THREE.BufferAttribute;
      
      // 변형 기준점 복제 (원본은 손상시키지 않음)
      if (!targetMesh.geometry.attributes.basePosition) {
        const clonedPos = posAttr.clone();
        targetMesh.geometry.setAttribute('basePosition', clonedPos);
        bboxRef.current.setFromBufferAttribute(clonedPos);
      }

      const box = bboxRef.current;
      const boxSize = new THREE.Vector3();
      box.getSize(boxSize);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // 기존에 렌더링된 가짜 얼굴 & 블랙홀 초기화
      const oldOverlay = targetMesh.getObjectByName('FaceOverlay') as THREE.Mesh;
      if (oldOverlay) {
        targetMesh.remove(oldOverlay);
        oldOverlay.geometry.dispose();
        (oldOverlay.material as THREE.Material).dispose();
      }
      
      const oldHole = targetMesh.getObjectByName('BlackHole') as THREE.Mesh;
      if (oldHole) {
        targetMesh.remove(oldHole);
        oldHole.geometry.dispose();
        (oldHole.material as THREE.Material).dispose();
      }

      // 텍스처(사용자 사진) 맵핑 연산
      if (texture && landmarks) {
        texture.flipY = true;
        
        // 랜드마크 기준 크롭 영역 최적화 (얼굴을 크게 확대하여 여백을 꽉 채움)
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        landmarks.forEach(lm => {
          if (lm.x < minX) minX = lm.x;
          if (lm.x > maxX) maxX = lm.x;
          if (lm.y < minY) minY = lm.y;
          if (lm.y > maxY) maxY = lm.y;
        });

        const faceW = maxX - minX;
        const faceH = maxY - minY;
        
        // [수정] 패딩(여백)을 넉넉히 주어 테두리 픽셀이 완벽히 투명해지도록 만듭니다 (살점 번짐 방지)
        const padX = faceW * 0.15;
        const padY = faceH * 0.15;
        
        const cropMinX = Math.max(0, minX - padX);
        const cropMaxX = Math.min(1, maxX + padX);
        const cropMinY = Math.max(0, minY - padY);
        const cropMaxY = Math.min(1, maxY + padY);

        const cropW = cropMaxX - cropMinX;
        const cropH = cropMaxY - cropMinY;

        texture.repeat.set(cropW, cropH);
        texture.offset.set(cropMinX, 1 - cropMaxY);

        // 오버레이용 지오메트리 복제
        const overlayGeo = targetMesh.geometry.clone();
        const oPosAttr = overlayGeo.attributes.position as THREE.BufferAttribute;
        const normAttr = overlayGeo.attributes.normal as THREE.BufferAttribute;
        const newUvs = new Float32Array(oPosAttr.count * 2);

        // [수정] 3D 모델상에 얼굴을 투영할 스케일 조절 
        // 숫자가 커질수록 얼굴이 작게 맵핑됩니다. 기존 0.8 -> 2.5로 대폭 키워 중앙 영역에 쏙 들어가게 만듭니다.
        const faceScaleX = 1.5; 
        const faceScaleY = 1.6;

        for (let i = 0; i < oPosAttr.count; i++) {
          const x = oPosAttr.getX(i);
          const y = oPosAttr.getY(i);
          const z = oPosAttr.getZ(i);

          let isFront = z > center.z;
          if (normAttr) isFront = isFront && normAttr.getZ(i) > 0;

          // 모델 정면에 딱 맞게 UV 확장 및 중앙 정렬
          const u = ((x - center.x) / boxSize.x) * faceScaleX + 0.5;
          const v = ((y - center.y) / boxSize.y) * faceScaleY + 0.35;

          if (isFront) {
            newUvs[i * 2] = u;
            newUvs[i * 2 + 1] = v;
          } else {
            newUvs[i * 2] = 0;
            newUvs[i * 2 + 1] = 0;
          }
        }
        overlayGeo.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));

        const overlayMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          roughness: 0.6,
        });

        const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
        overlayMesh.name = 'FaceOverlay';
        targetMesh.add(overlayMesh);

        // 리얼 딥다크 블랙홀 생성
        const holeGeo = new THREE.SphereGeometry(1, 32, 32);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const holeMesh = new THREE.Mesh(holeGeo, holeMat);
        holeMesh.name = 'BlackHole';
        holeMesh.visible = false;
        targetMesh.add(holeMesh);
      }
    }
  }, [scene, texture, landmarks]);

  // 2. 매 프레임 위치 계산 및 3D 입체 워핑 (원본 + 오버레이 동시 변형)
  useFrame(() => {
    if (!faceMeshRef.current) return;
    
    const targetMesh = faceMeshRef.current;
    const overlayMesh = targetMesh.getObjectByName('FaceOverlay') as THREE.Mesh;
    const blackHole = targetMesh.getObjectByName('BlackHole') as THREE.Mesh;

    const meshesToWarp = [targetMesh];
    if (overlayMesh) meshesToWarp.push(overlayMesh);

    const center = new THREE.Vector3();
    const sizeBox = new THREE.Vector3();
    bboxRef.current.getCenter(center);
    bboxRef.current.getSize(sizeBox);

    // [수정] 작아진 얼굴 비율에 맞게 입 위치(Y축) 조금 더 위로 보정
    const mouth3DLocal = new THREE.Vector3(
      center.x,
      center.y - sizeBox.y * 0.08, 
      center.z + sizeBox.z * 0.45
    );

    const worldMouth = mouth3DLocal.clone().applyMatrix4(targetMesh.matrixWorld);
    const screenPos = worldMouth.clone().project(camera);
    onMouthPositionUpdate({
      x: (screenPos.x * 0.5 + 0.5) * size.width,
      y: (-(screenPos.y * 0.5) + 0.5) * size.height,
    });

    const p = warpProgress.current; // 물건이 가까워질수록 (0 -> 1 -> 2.5) 커지는 변형 강도

    // 블랙홀 제어 (크기 축소)
    if (blackHole) {
      blackHole.position.copy(mouth3DLocal);
      blackHole.position.z -= sizeBox.z * 0.08; 
      blackHole.scale.set(p * sizeBox.x * 0.12, p * sizeBox.y * 0.18, 0.1);
      blackHole.visible = p > 0.02;
    }

    meshesToWarp.forEach((mesh) => {
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const basePos = mesh.geometry.attributes.basePosition as THREE.BufferAttribute;
      if (!basePos) return;

      if (p === 0) {
        let isChanged = false;
        for (let i = 0; i < pos.count; i++) {
          if (pos.getX(i) !== basePos.getX(i)) {
            pos.setXYZ(i, basePos.getX(i), basePos.getY(i), basePos.getZ(i));
            isChanged = true;
          }
        }
        if (isChanged) pos.needsUpdate = true;
        return;
      }

      // [수정] 워핑 반경 축소 (얼굴이 작아졌으므로 영향 범위도 줄임)
      const radius = sizeBox.y * 0.22;

      for (let i = 0; i < pos.count; i++) {
        let vx = basePos.getX(i);
        let vy = basePos.getY(i);
        let vz = basePos.getZ(i);

        const dx = vx - mouth3DLocal.x;
        const dy = vy - mouth3DLocal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const nDist = dist / radius; 
          const falloff = Math.pow(1 - nDist, 2);

          // 1. 입 벌림 (위아래, 양옆 확장 강도 축소)
          if (dy < 0) vy -= p * sizeBox.y * 0.12 * falloff;
          else vy += p * sizeBox.y * 0.05 * falloff;
          
          vx += Math.sign(dx) * p * sizeBox.x * 0.12 * falloff;

          // 2. 완벽한 리얼 블랙홀 연출 (목구멍)
          const throatPush = Math.max(0, 1 - (nDist * 3.0)); 
          vz -= p * sizeBox.z * 0.5 * throatPush; 
          
          // 입술 주변
          vz -= p * sizeBox.z * 0.05 * falloff;
        }

        pos.setXYZ(i, vx, vy, vz);
      }
      pos.needsUpdate = true;
    });
  });

  return (
    <group position={[0, -0.6, 0]}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
};