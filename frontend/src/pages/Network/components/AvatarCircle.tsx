import React from 'react';
import { ENV } from '../../../config/env';

interface AvatarCircleProps {
  name: string;
  img?: string | null;
  size?: string;
}

const resolveImgUrl = (img?: string | null): string | null => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${ENV.API_URL}${img}`;
};

const avatar = (name: string, img?: string | null) => {
  const src = resolveImgUrl(img);
  return src ? (
    <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
  ) : (
    <span className="text-sm font-bold text-white">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
};

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  name,
  img,
  size = 'w-10 h-10'
}) => (
  <div className={`${size} rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0`}>
    {avatar(name, img)}
  </div>
);
