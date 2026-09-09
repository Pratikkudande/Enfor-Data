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
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return src ? (
    <>
      <img 
        src={src} 
        alt={name} 
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Hide broken image and show initials fallback
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = parent.querySelector('.avatar-fallback');
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex';
            }
          }
        }}
      />
      <span className="avatar-fallback text-sm font-bold text-white absolute inset-0 items-center justify-center" 
            style={{ display: 'none' }}>
        {initials}
      </span>
    </>
  ) : (
    <span className="text-sm font-bold text-white">
      {initials}
    </span>
  );
};

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  name,
  img,
  size = 'w-10 h-10'
}) => (
  <div className={`${size} rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0 relative`}>
    {avatar(name, img)}
  </div>
);
