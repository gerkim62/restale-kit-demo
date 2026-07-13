import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 w-full" style={{ padding: '0.5rem 0' }}>
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="glass-panel animate-shimmer flex items-center justify-between p-4" 
          style={{ height: '62px', border: '1px solid hsl(var(--card-border))' }}
        >
          <div className="flex items-center gap-3 w-3/4">
            {/* Custom Checkbox Placeholder */}
            <div 
              style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '6px', 
                background: 'hsl(217.2 32.6% 17.5% / 0.5)',
                flexShrink: 0
              }} 
            />
            {/* Title Line Placeholder */}
            <div 
              style={{ 
                height: '14px', 
                borderRadius: '4px', 
                background: 'hsl(217.2 32.6% 17.5% / 0.5)',
                width: i === 1 ? '40%' : i === 2 ? '65%' : '50%'
              }} 
            />
          </div>
          {/* Action Button Placeholder */}
          <div 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'hsl(217.2 32.6% 17.5% / 0.5)' 
            }} 
          />
        </div>
      ))}
    </div>
  );
};
export default SkeletonLoader;
