// src/components/Skeleton.jsx
// Building blocks for skeleton loaders. Pure CSS, no JS animation libs.
// Used in PageSkeleton, Admin.jsx, Dealers.jsx, Products.jsx.

import React from 'react';

export function Skeleton({ width, height, radius = 8, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ width = '100%', lines = 1, gap = 8 }) {
  return (
    <div className="skeleton-text-block" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '70%' : width}
          height={12}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40 }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

export function SkeletonCard({ height = 140 }) {
  return (
    <div className="skeleton-card-block">
      <Skeleton width="60%" height={16} />
      <div style={{ height: 8 }} />
      <SkeletonText lines={2} />
      <div style={{ height: 12 }} />
      <Skeleton width="40%" height={32} radius={8} />
    </div>
  );
}

export default Skeleton;
