import React from 'react';

const MapView = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px',
      background: 'var(--bg-main)'
    }}>
      <iframe 
        src="http://tekao.fr:8100" 
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        title="ElderSea Map"
        allowFullScreen
      />
    </div>
  );
};

export default MapView;
