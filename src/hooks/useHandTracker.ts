/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandState, GestureType } from '../types';

export function useHandTracker(webcamRef: React.RefObject<any>) {
  const [handState, setHandState] = useState<HandState>({
    indexTip: { x: 0, y: 0 },
    thumbTip: { x: 0, y: 0 },
    isPinching: false,
    gesture: 'none',
    isVisible: false,
  });

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const onResults = useCallback((results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];
      const wrist = landmarks[0];

      // Euclidean distance helper
      const dist = (p1: any, p2: any) => Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
      );

      // 1. Pinch detection
      const pinchDist = dist(indexTip, thumbTip);
      const isPinching = pinchDist < 0.04;

      // 2. Gesture classification
      let detectedGesture: GestureType = 'none';

      // Distances from wrist to tips to determine if fingers are extended
      const thumbExt = dist(thumbTip, wrist) > 0.15;
      const indexExt = dist(indexTip, wrist) > 0.2;
      const middleExt = dist(middleTip, wrist) > 0.2;
      const ringExt = dist(ringTip, wrist) > 0.2;
      const pinkyExt = dist(pinkyTip, wrist) > 0.2;

      const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(v => v).length;

      if (isPinching) {
        detectedGesture = 'pinch';
      } else if (extendedCount >= 4) {
        detectedGesture = 'palm';
      } else if (extendedCount === 0) {
        detectedGesture = 'fist';
      } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
        detectedGesture = 'peace';
      }

      setHandState({
        indexTip: { x: indexTip.x, y: indexTip.y },
        thumbTip: { x: thumbTip.x, y: thumbTip.y },
        isPinching,
        gesture: detectedGesture,
        isVisible: true,
      });
    } else {
      setHandState(prev => prev.isVisible ? { ...prev, isVisible: false, gesture: 'none' } : prev);
    }
  }, []);

  useEffect(() => {
    let active = true;
    
    // MediaPipe Hands setup
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    // Detection loop helper
    const startTracking = () => {
      const videoElement = webcamRef.current?.video;
      if (!videoElement || !active) return;

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (webcamRef.current?.video && active) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start()
        .then(() => console.log("Hand tracking camera started"))
        .catch(err => console.error("Hand tracking camera error:", err));
      
      cameraRef.current = camera;
    };

    // Wait for webcam to be ready
    const checkInterval = setInterval(() => {
      if (webcamRef.current?.video?.readyState >= 2) {
        clearInterval(checkInterval);
        startTracking();
      }
    }, 500);

    return () => {
      active = false;
      clearInterval(checkInterval);
      if (cameraRef.current) cameraRef.current.stop();
      hands.close();
    };
  }, [webcamRef, onResults]);

  return handState;
}
