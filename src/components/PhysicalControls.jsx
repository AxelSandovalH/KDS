import React from 'react';

export default function PhysicalControls({ onNext, onMarkDone }) {
  return (
    <div className="flex justify-center gap-4 mt-4">
      <button onClick={onNext} className="bg-gray-800 text-white px-6 py-2 rounded-lg">
        ⭢ Siguiente
      </button>
      <button onClick={onMarkDone} className="bg-green-600 text-white px-6 py-2 rounded-lg">
        ✔ Listo
      </button>
    </div>
  );
}
