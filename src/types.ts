/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HandPoint {
  x: number;
  y: number;
}

export interface HandState {
  indexTip: HandPoint;
  thumbTip: HandPoint;
  isPinching: boolean;
  isVisible: boolean;
}

export interface CardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  initialX: number;
  initialY: number;
  initialRotate: number;
  color: string;
}

export const CARDS: CardData[] = [
  {
    id: '1',
    title: 'Structure I',
    description: 'Foundations of futuristic brutalism.',
    imageUrl: 'https://picsum.photos/seed/arch1/600/400',
    initialX: 15,
    initialY: 10,
    initialRotate: -5,
    color: '#1a1a1a',
  },
  {
    id: '2',
    title: 'Refraction',
    description: 'Light and steel in harmony.',
    imageUrl: 'https://picsum.photos/seed/arch2/600/400',
    initialX: 55,
    initialY: 20,
    initialRotate: 8,
    color: '#2a2a2a',
  },
  {
    id: '3',
    title: 'Depth',
    description: 'The geometry of shadows.',
    imageUrl: 'https://picsum.photos/seed/arch3/600/400',
    initialX: 25,
    initialY: 55,
    initialRotate: -3,
    color: '#151515',
  },
  {
    id: '4',
    title: 'Flow',
    description: 'Curves in cold concrete.',
    imageUrl: 'https://picsum.photos/seed/arch4/600/400',
    initialX: 65,
    initialY: 50,
    initialRotate: 12,
    color: '#1e1e1e',
  },
];
