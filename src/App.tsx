/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence, useSpring } from 'motion/react';
import { Hand, Camera, Info, Maximize2, Layers, Sparkles, LayoutGrid, Target } from 'lucide-react';
import { useHandTracker } from './hooks/useHandTracker';
import { CARDS, CardData, GestureType } from './types';

// Cursor component to show hand position
const HandCursor = ({ x, y, gesture, isVisible }: { x: number; y: number; gesture: GestureType; isVisible: boolean }) => {
  const springX = useSpring(x, { damping: 25, stiffness: 200 });
  const springY = useSpring(y, { damping: 25, stiffness: 200 });

  useEffect(() => {
    springX.set(x);
    springY.set(y);
  }, [x, y, springX, springY]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      className="fixed pointer-events-none z-[100] mix-blend-difference"
    >
      <div 
        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 ${gesture !== 'none' ? 'scale-125' : 'scale-100'}`}
      >
        <div className={`w-1 h-1 bg-white rounded-full transition-all duration-300 ${gesture === 'pinch' ? 'scale-[10] opacity-50' : 'scale-100'}`} />
      </div>
    </motion.div>
  );
};

// Card Component
interface DeckCardProps {
  card: CardData;
  containerSize: { width: number; height: number };
  handPos: { x: number; y: number };
  gesture: GestureType;
  globalLayout: 'default' | 'scatter' | 'stack';
}

const DeckCard = ({ 
  card, 
  containerSize, 
  handPos, 
  gesture,
  globalLayout
}: DeckCardProps) => {
  const [isGrabbed, setIsGrabbed] = useState(false);
  const [z, setZ] = useState(1);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize and handle global layouts
  useEffect(() => {
    if (containerSize.width > 0) {
      let targetX = (card.initialX / 100) * containerSize.width;
      let targetY = (card.initialY / 100) * containerSize.height;

      if (globalLayout === 'scatter') {
        targetX = Math.random() * (containerSize.width - 280);
        targetY = Math.random() * (containerSize.height - 380);
      } else if (globalLayout === 'stack') {
        targetX = containerSize.width / 2 - 140;
        targetY = containerSize.height / 2 - 190;
      }

      setCurrentPos({ x: targetX, y: targetY });
      setHasInitialized(true);
    }
  }, [containerSize, card.initialX, card.initialY, globalLayout]);

  // Calculate if hand is over card
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 380;

  useEffect(() => {
    if (gesture === 'pinch') {
      const dx = Math.abs(handPos.x - (currentPos.x + CARD_WIDTH / 2));
      const dy = Math.abs(handPos.y - (currentPos.y + CARD_HEIGHT / 2));

      if (dx < CARD_WIDTH / 2 + 20 && dy < CARD_HEIGHT / 2 + 20) {
        setIsGrabbed(true);
        setZ(50);
      }
    } else {
      setIsGrabbed(false);
      setZ(1);
    }
  }, [gesture, handPos.x, handPos.y, currentPos.x, currentPos.y]);

  useEffect(() => {
    if (isGrabbed) {
      setCurrentPos({
        x: handPos.x - CARD_WIDTH / 2,
        y: handPos.y - CARD_HEIGHT / 2
      });
    }
  }, [isGrabbed, handPos]);

  return (
    <motion.div
      initial={{ 
        x: (card.initialX / 100) * containerSize.width, 
        y: (card.initialY / 100) * containerSize.height,
        rotate: card.initialRotate,
        opacity: 0,
        scale: 0.8
      }}
      animate={{ 
        x: currentPos.x, 
        y: currentPos.y, 
        zIndex: z,
        opacity: 1,
        scale: isGrabbed ? 1.05 : 1,
        rotate: isGrabbed ? 0 : (globalLayout === 'stack' ? card.initialRotate / 2 : card.initialRotate),
      }}
      transition={{ 
        type: 'spring', 
        damping: isGrabbed ? 40 : 25, 
        stiffness: isGrabbed ? 300 : 150 
      }}
      className="absolute bg-dark-surface rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing group border border-dark-border"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <div className="h-[180px] bg-dark-border/30 overflow-hidden relative">
        <img 
          src={card.imageUrl} 
          alt={card.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface to-transparent opacity-60" />
      </div>
      <div className="p-6 flex flex-col justify-between h-[200px]">
        <div>
          <h3 className="font-sans font-bold text-lg text-white tracking-tight mb-2 uppercase">{card.title}</h3>
          <p className="font-sans text-xs text-text-dim leading-relaxed">{card.description}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-accent border border-accent/30 bg-accent/5 px-2 py-1 rounded w-fit">
          <span>ID: {card.id.padStart(4, '0')}-X</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const [globalLayout, setGlobalLayout] = useState<'default' | 'scatter' | 'stack'>('default');

  // Resize handling
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handState = useHandTracker(webcamRef as any);

  // Gesture Actions
  useEffect(() => {
    if (handState.gesture === 'palm') {
      setGlobalLayout('scatter');
    } else if (handState.gesture === 'fist') {
      setGlobalLayout('stack');
    } else if (handState.gesture === 'peace') {
      setGlobalLayout('default');
    }
  }, [handState.gesture]);

  // Convert normalized hand coords to screen coords
  const screenHandPos = useMemo(() => ({
    x: (1 - handState.indexTip.x) * containerSize.width,
    y: handState.indexTip.y * containerSize.height
  }), [handState.indexTip, containerSize]);

  return (
    <div className="relative w-full h-screen bg-dark-bg overflow-hidden font-sans select-none text-[#f8fafc]">
      {/* Background Typography Watermark */}
      <div className="absolute top-10 left-8 title-big pointer-events-none opacity-10">
        SPATIAL<br />EXPLORER
      </div>

      {/* Header / Nav UI */}
      <header className="absolute top-0 left-0 w-full p-10 flex justify-between items-start z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            GESTURE DECK
          </h1>
          <p className="text-[10px] font-mono text-text-dim mt-1 uppercase tracking-[0.3em]">system.calibration_active</p>
        </div>
        
        <div className="flex flex-col items-end gap-4 pointer-events-auto text-right">
          <nav className="flex flex-col gap-2">
            <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${globalLayout === 'default' ? 'text-accent' : 'text-text-dim'}`}>[ GRID_MODE ]</span>
            <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${globalLayout === 'scatter' ? 'text-accent' : 'text-text-dim'}`}>[ SCATTER_MODE ]</span>
            <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${globalLayout === 'stack' ? 'text-accent' : 'text-text-dim'}`}>[ STACK_MODE ]</span>
          </nav>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="mt-4 px-4 py-2 border border-dark-border rounded-full hover:bg-dark-surface transition-colors text-[10px] font-mono tracking-widest uppercase flex items-center gap-2"
          >
            <Info size={12} />
            <span>Info</span>
          </button>
        </div>
      </header>

      {/* Gesture HUD / Camera Container */}
      <div className="fixed bottom-10 right-10 w-64 bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-6 z-50 shadow-2xl">
        <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4 border border-dark-border">
          <Webcam
            ref={webcamRef}
            {...({
              audio: false,
              mirrored: true,
              className: "w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500",
              screenshotFormat: "image/webp",
              videoConstraints: { width: 640, height: 480, facingMode: 'user' }
            } as any)}
          />
        </div>
        
        <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
          <div className="flex justify-between items-center">
            <span className="text-text-dim">Engine</span>
            <div className={`w-2 h-2 rounded-full ${handState.isVisible ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          </div>
          <div className="flex justify-between items-center pt-1">
            <span>Gesture</span>
            <span className="text-accent font-bold">{handState.gesture !== 'none' ? handState.gesture : 'IDLE'}</span>
          </div>
          <div className="h-px bg-dark-border my-2" />
          
          {/* Gesture Guide */}
          <div className="space-y-2 pt-1 opacity-80">
            <div className="flex items-center gap-3 text-text-dim">
              <Sparkles size={12} className="text-accent" />
              <span>Open Palm → Scatter</span>
            </div>
            <div className="flex items-center gap-3 text-text-dim">
              <Layers size={12} className="text-accent" />
              <span>Fist → Stack Center</span>
            </div>
            <div className="flex items-center gap-3 text-text-dim">
              <LayoutGrid size={12} className="text-accent" />
              <span>Peace → Reset Grid</span>
            </div>
            <div className="flex items-center gap-3 text-text-dim">
              <Target size={12} className="text-accent" />
              <span>Pinch → Grab Item</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Canvas */}
      <div ref={containerRef} className="relative w-full h-full">
        {CARDS.map((card) => (
          <DeckCard 
            key={card.id}
            {...({ 
              card, 
              containerSize, 
              handPos: screenHandPos, 
              gesture: handState.gesture,
              globalLayout
            } as any)}
          />
        ))}

        {/* Instructions Overlay */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-[60] bg-dark-bg/60 backdrop-blur-md p-6"
            >
              <div className="max-w-md bg-dark-surface p-12 rounded-3xl shadow-2xl border border-dark-border">
                <div className="bg-accent w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Hand className="text-white" size={24} />
                </div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Access Calibration</h2>
                <p className="text-text-dim mb-10 leading-relaxed text-sm">
                  The spatial engine recognizes complex hand geometry. 
                  <span className="text-white block mt-6 font-mono text-[10px] tracking-widest border-l-2 border-accent pl-4 uppercase">
                    Open palm to scatter, Fist to stack, Peace to reset.
                  </span>
                </p>
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-4 bg-white text-dark-bg rounded-xl font-bold hover:bg-accent hover:text-white transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  Initiate System
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hand Cursor */}
        <HandCursor 
          x={screenHandPos.x} 
          y={screenHandPos.y} 
          gesture={handState.gesture} 
          isVisible={handState.isVisible} 
        />
      </div>

      {/* Footer / Camera Control UI */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-4 pointer-events-none z-50">
        <div className="flex gap-4">
          <div className="w-10 h-10 border border-dark-border rounded-full flex items-center justify-center text-[10px] font-mono text-text-dim">L</div>
          <div className="w-10 h-10 border border-dark-border rounded-full flex items-center justify-center text-[10px] font-mono text-text-dim">R</div>
          <div className="w-10 h-10 border border-dark-border rounded-full flex items-center justify-center text-[10px] font-mono text-text-dim">T</div>
        </div>
        <div className="text-[10px] font-mono text-accent uppercase tracking-widest">
          {handState.isVisible ? `Hand detected: ${handState.gesture}` : 'Scanning for input...'}
        </div>
      </div>
    </div>
  );
}
