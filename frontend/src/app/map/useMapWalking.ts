'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RoadNetwork, Point } from './roads';
import { findPath, distance, expandPath } from './roads';
import { smoothPath, createRoute, directionWithHysteresis } from './walkPath';
import {
  directionFromDelta,
  screenStride,
  type Direction,
  type CharacterManifest,
} from '@/components/character/characterManifest';

export const CHARACTER_REF_LAYER_SCALE = 0.6;
export const CHARACTER_SPRITE_SCALE = 0.36;
// Yürüme hızı çarpanı: yüzde tabanlı yolların hızı (eski değerler 15 / 75) bununla ölçeklenir.
// Yürüyüş sprite'ı ve ayak sesleri mesafeden türetilen faza bağlı olduğundan hız artınca birlikte hızlanır.
const WALK_SPEED_MULTIPLIER = 5;
const WALK_SPEED = 15 * WALK_SPEED_MULTIPLIER;
// Görsel yollarda hız (referans piksel/sn) rotanın uzunluğuna göre seçilir: kısa rotalar
// SCREEN_WALK_SPEED ile yürünür, uzun rotalar WALK_MAX_DURATION içinde bitecek kadar hızlanır.
// Böylece her yolculuk 4 saniyenin altında kalır (tipik ~2,5–3 sn, en uzun ~3,5 sn).
const SCREEN_WALK_SPEED = 75 * WALK_SPEED_MULTIPLIER;
const WALK_MAX_SPEED = 850;
const WALK_MAX_DURATION = 2.4;
// Hızlı yürüyüşte bir sprite döngüsü bu kat daha uzun yol alır (koşar adım). Böylece sprite
// saniyede 8-10 döngüye çıkıp bulanıklaşmaz; fark küçük olduğundan ayak kayması belli olmaz.
const WALK_STRIDE_FACTOR = 1.5;
const WALK_ACCEL_TIME = 0.25;
const WALK_DECEL_DISTANCE = 30;
const WALK_LOOKAHEAD = 12;

export const depthScaleAt = (y: number, imageHeight: number) => 0.82 + 0.2 * (y / imageHeight);

export interface UseMapWalkingOptions {
  roads: RoadNetwork;
  restNodeId: string;
  character?: CharacterManifest | null;
  imageLayerRef: React.RefObject<HTMLDivElement | null>;
  onArrive: (locId: string) => Promise<void> | void;
  setLastLocationId: (locId: string) => void;
}

export function useMapWalking({
  roads,
  restNodeId,
  character,
  imageLayerRef,
  onArrive,
  setLastLocationId,
}: UseMapWalkingOptions) {
  const [walkPos, setWalkPos] = useState<Point | null>(null);
  const [playerFacing, setPlayerFacing] = useState<Direction>('south');
  const [walkingTo, setWalkingTo] = useState<string | null>(null);
  const [walkPhase, setWalkPhase] = useState(0);
  const walkFrame = useRef<number | null>(null);

  const characterScale = roads.characterScale ?? 1;
  const roadImage = roads.image;
  const [layerScale, setLayerScale] = useState(CHARACTER_REF_LAYER_SCALE);

  // ResizeObserver to keep layerScale in sync with container width
  useEffect(() => {
    const layer = imageLayerRef.current;
    if (!layer || !roadImage) return;
    const observer = new ResizeObserver(() => setLayerScale(layer.offsetWidth / roadImage.width));
    observer.observe(layer);
    return () => observer.disconnect();
  }, [imageLayerRef, roadImage]);

  // Clean up any in-flight animation frame on unmount
  useEffect(() => {
    return () => {
      if (walkFrame.current !== null) {
        cancelAnimationFrame(walkFrame.current);
        walkFrame.current = null;
      }
    };
  }, []);

  const cancelWalk = useCallback(() => {
    if (walkFrame.current !== null) {
      cancelAnimationFrame(walkFrame.current);
      walkFrame.current = null;
    }
    setWalkingTo(null);
    setWalkPos(null);
  }, []);

  const walkAlongPercentRoads = useCallback(
    (locId: string, doorId: string) => {
      const points = findPath(roads, restNodeId, doorId).map((id) => roads.nodes[id]);
      const segmentLengths = points.slice(1).map((p, i) => distance(points[i], p));
      const totalLength = segmentLengths.reduce((sum, len) => sum + len, 0);

      const arrive = async () => {
        walkFrame.current = null;
        setLastLocationId(locId);
        await onArrive(locId);
        setWalkingTo(null);
        setWalkPos(null);
      };

      setWalkingTo(locId);
      setWalkPhase(0);
      if (totalLength === 0) {
        arrive();
        return;
      }

      let startTime: number | null = null;
      const step = (now: number) => {
        startTime ??= now;
        let travelled = ((now - startTime) / 1000) * WALK_SPEED;
        if (travelled >= totalLength) {
          setWalkPos(points[points.length - 1]);
          arrive();
          return;
        }

        let i = 0;
        while (travelled > segmentLengths[i]) {
          travelled -= segmentLengths[i];
          i++;
        }
        const from = points[i];
        const to = points[i + 1];
        const t = segmentLengths[i] === 0 ? 1 : travelled / segmentLengths[i];
        if (to.x !== from.x || to.y !== from.y) {
          setPlayerFacing(directionFromDelta(to.x - from.x, to.y - from.y));
        }
        // Faz zamana bağlı olduğundan sprite döngüsü de hız çarpanıyla hızlanır (kayma olmasın)
        setWalkPhase(
          ((now - startTime) / 1000 / (character?.walk.cycleSeconds ?? 1)) * WALK_SPEED_MULTIPLIER
        );
        setWalkPos({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
        walkFrame.current = requestAnimationFrame(step);
      };
      walkFrame.current = requestAnimationFrame(step);
    },
    [roads, restNodeId, character, onArrive, setLastLocationId]
  );

  const walkAlongImageRoads = useCallback(
    (locId: string, doorId: string, image: { width: number; height: number }) => {
      const points = expandPath(roads, findPath(roads, restNodeId, doorId));
      const route = createRoute(smoothPath(points, 6));
      const currentLayerScale = (imageLayerRef.current?.offsetWidth ?? window.innerWidth) / image.width;

      const arrive = async () => {
        walkFrame.current = null;
        setLastLocationId(locId);
        await onArrive(locId);
        setWalkingTo(null);
        setWalkPos(null);
      };

      setWalkingTo(locId);
      setWalkPhase(0);
      if (route.length === 0) {
        arrive();
        return;
      }

      const sizeScale = (currentLayerScale / CHARACTER_REF_LAYER_SCALE) * characterScale;
      const baseSpeed = Math.min(
        WALK_MAX_SPEED,
        Math.max(
          SCREEN_WALK_SPEED,
          (route.length * currentLayerScale) / sizeScale / WALK_MAX_DURATION
        )
      );

      const lookahead = WALK_LOOKAHEAD / currentLayerScale;
      const firstAhead = route.pointAt(lookahead);
      let facing = directionFromDelta(firstAhead.x - points[0].x, firstAhead.y - points[0].y);
      setPlayerFacing(facing);

      let travelled = 0;
      let elapsed = 0;
      let phase = 0;
      let lastTime: number | null = null;

      const step = (now: number) => {
        const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 1);
        lastTime = now;
        elapsed += dt;

        const pos = route.pointAt(travelled);
        const remaining = (route.length - travelled) * currentLayerScale;
        const ease = Math.min(
          1,
          0.35 + (0.65 * elapsed) / WALK_ACCEL_TIME,
          0.35 + (0.65 * remaining) / (WALK_DECEL_DISTANCE * sizeScale)
        );
        const depth = depthScaleAt(pos.y, image.height);
        const towards = route.pointAt(travelled + 2);
        const stride = character ? screenStride(character, towards.x - pos.x, towards.y - pos.y) : 0;
        const directionFactor = character ? stride / screenStride(character, 1, 0) : 1;
        const screenSpeed = baseSpeed * sizeScale * depth * ease * directionFactor;
        const advance = (screenSpeed / currentLayerScale) * dt;
        travelled += advance;

        if (stride > 0) {
          phase +=
            (advance * CHARACTER_REF_LAYER_SCALE) /
            (stride * WALK_STRIDE_FACTOR * CHARACTER_SPRITE_SCALE * characterScale * depth);
          setWalkPhase(phase);
        }

        if (travelled >= route.length) {
          setWalkPos(route.pointAt(route.length));
          arrive();
          return;
        }

        const next = route.pointAt(travelled);
        const ahead = route.pointAt(travelled + lookahead);
        if (Math.hypot(ahead.x - next.x, ahead.y - next.y) > 0.5) {
          facing = directionWithHysteresis(ahead.x - next.x, ahead.y - next.y, facing);
          setPlayerFacing(facing);
        }
        setWalkPos(next);
        walkFrame.current = requestAnimationFrame(step);
      };
      walkFrame.current = requestAnimationFrame(step);
    },
    [roads, restNodeId, character, characterScale, imageLayerRef, onArrive, setLastLocationId]
  );

  const handleWalkToLocation = useCallback(
    (locId: string) => {
      if (walkingTo) return;

      const doorId = roads.doors[locId];
      if (!doorId) {
        onArrive(locId);
        return;
      }

      if (roads.image) {
        walkAlongImageRoads(locId, doorId, roads.image);
      } else {
        walkAlongPercentRoads(locId, doorId);
      }
    },
    [walkingTo, roads, onArrive, walkAlongImageRoads, walkAlongPercentRoads]
  );

  const fallbackPos = roads.nodes[restNodeId] ?? { x: 50, y: 50 };
  const playerPos = (walkingTo && walkPos) || fallbackPos;

  return {
    walkPos,
    playerFacing,
    walkingTo,
    walkPhase,
    layerScale,
    playerPos,
    characterScale,
    handleWalkToLocation,
    cancelWalk,
  };
}
