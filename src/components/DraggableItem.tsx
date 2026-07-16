import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import type { FeedItem } from '../types';

interface Props {
  item: FeedItem;
  onDrag: (e: any, info: PanInfo) => void;
  onDragEnd: (e: any, info: PanInfo, item: FeedItem) => void;
}

const DraggableItem: React.FC<Props> = ({ item, onDrag, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragSnapToOrigin 
      onDragStart={() => setIsDragging(true)}
      onDrag={(e, info) => onDrag(e, info)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onDragEnd(e, info, item);
      }}
      whileDrag={{ scale: 1.5, zIndex: 50 }}
      className={`w-16 h-16 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing rounded-xl transition-colors ${
        isDragging ? 'bg-transparent' : 'hover:bg-gray-100'
      }`}
      title={item.name}
    >
      <span className="text-4xl select-none pointer-events-none">{item.emoji}</span>
    </motion.div>
  );
};

export default DraggableItem;