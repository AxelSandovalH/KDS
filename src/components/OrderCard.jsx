import React from 'react';
import clsx from 'clsx'; // Opcional: si usás clsx para manejar clases condicionales

export default function OrderCard({ order, isSelected }) {
  const cardColors = {
  NEW: 'bg-green-600',
  PREPARING: 'bg-yellow-500',
  COOKING: 'bg-red-500',
  ALMOST_DONE: 'bg-orange-500',
  READY: 'bg-blue-600',
  OVERDUE: 'bg-red-700',
};


  return (
    <div
      className={clsx(
        'rounded-xl p-4 text-white shadow-lg transition-all duration-200 relative',
        cardColors[order.status],
        {
          'ring-4 ring-white ring-offset-2 scale-105 shadow-2xl': isSelected,
        }
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-white text-black text-xs font-bold px-2 py-1 rounded">
          SELECCIONADO
        </div>
      )}
      <h2 className="text-xl font-bold">#{order.id}</h2>
      <p className="mb-2">Mesa {order.table}</p>
      <p className="text-sm">Inicio: {order.startedAt}</p>
      <div className="h-40 bg-black/30 mt-4 flex items-center justify-center text-sm rounded-md border border-white/40">
        <span>📷 Imagen de la orden</span>
      </div>
      <div className="mt-4 font-semibold">
        {order.status === 'OVERDUE' ? (
          <span className="text-red-300">⚠️ OVERDUE!</span>
        ) : (
          <span className="text-sm">Tiempo restante: {order.timeRemaining}</span>
        )}
      </div>
    </div>
  );
}
