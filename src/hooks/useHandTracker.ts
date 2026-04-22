/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandState } from '../types';

export function useHandTracker(webcamRef: React.RefObject<any>) {
  const [handState, setHandState] = useState<HandState>({
    indexTip: { x: 0, y: 0 },
    thumbTip: { x: 0, y: 0 },
    isPinching: false,
    isVisible: false,
  });

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const onResults = useCallback((results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const distance = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) +
        Math.pow(indexTip.y - thumbTip.y, 2) +
        Math.pow(indexTip.z - thumbTip.z, 2)
      );

      const isPinching = distance < 0.04; // Slightly tighter pinch threshold

      setHandState({
        indexTip: { x: indexTip.x, y: indexTip.y },
        thumbTip: { x: thumbTip.x, y: thumbTip.y },
        isPinching,
        isVisible: true,
      });
    } else {
      setHandState(prev => prev.isVisible ? { ...prev, isVisible: false } : prev);
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
