// OrderCard.jsx
import React from 'react';

export default function OrderCard({ order, isSelected, displayTableNumber }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'NEW':
      case 'COOKING':
      case 'PREPARING':
        return {
          bgColor: 'bg-green-500',
          statusText: 'COOKING',
          statusBg: 'bg-green-600'
        };
      case 'ALMOST_DONE':
        return {
          bgColor: 'bg-orange-500',
          statusText: 'ALMOST DONE',
          statusBg: 'bg-orange-600'
        };
      case 'OVERDUE':
        return {
          bgColor: 'bg-red-500',
          statusText: 'OVERDUE',
          statusBg: 'bg-red-600'
        };
      case 'READY':
        return {
          bgColor: 'bg-blue-500', // Azul para READY
          statusText: 'READY',
          statusBg: 'bg-blue-600'
        };
      default:
        return {
          bgColor: 'bg-green-500',
          statusText: 'COOKING',
          statusBg: 'bg-green-600'
        };
    }
  };

  const getTimeDisplay = (order) => {
    if (order.status === 'OVERDUE') {
      return 'OVERDUE!';
    }
    return order.timeRemaining || '15:00';
  };

  const getProgressPercentage = (order) => {
    if (order.status === 'OVERDUE') return 100;
    if (!order.timeRemaining || order.timeRemaining === 'OVERDUE') return 100;

    try {
      const [mins, secs] = order.timeRemaining.split(':').map(Number);
      const remainingSeconds = mins * 60 + secs;
      const initialDurationSeconds = order.initialDuration || 900;
      const elapsedSeconds = initialDurationSeconds - remainingSeconds;
      return Math.max(0, Math.min(100, (elapsedSeconds / initialDurationSeconds) * 100));
    } catch {
      return 0;
    }
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div
      className={`${statusConfig.bgColor} rounded-2xl text-white relative transition-all duration-200 ${
        isSelected ? 'ring-4 ring-yellow-400 shadow-2xl' : 'shadow-lg'
      } flex flex-col`}
      style={{
        aspectRatio: '7/8',
      }}
    >
      <div className="flex justify-between items-center p-4 pb-2">
        <div className="min-w-0">
          {/* Mostramos el número de mesa REAL de la orden con el # */}
          <h3 className="text-4xl font-extrabold">#{displayTableNumber}</h3>
          {/* Eliminada la línea que mostraba "Mesa: {order.table}" */}
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black bg-opacity-20 min-w-0">
          <div className={`w-2.5 h-2.5 ${statusConfig.statusBg} rounded-full flex-shrink-0`}></div>
          <span className="text-sm font-medium uppercase truncate">{statusConfig.statusText}</span>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-75 uppercase tracking-wider">Time</p>
          <p className="text-sm opacity-75">{order.startTimeFormatted || order.startedAt}</p>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold">{getTimeDisplay(order)}</p>
          <div className="w-1/2 bg-black bg-opacity-20 rounded-full h-2.5 mb-1">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${getProgressPercentage(order)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-2 flex flex-col">
        <div className="relative h-0 pb-[110%] flex-grow">
          {order.image ? (
            <img
              src={order.image}
              alt={`Order ${order.id}`}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="absolute inset-0 bg-black bg-opacity-10 border-2 border-dashed border-white border-opacity-30 rounded-lg flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-white bg-opacity-30 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium opacity-90">NO IMAGE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}