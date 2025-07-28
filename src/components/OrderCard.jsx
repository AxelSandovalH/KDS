import React from 'react';

export default function OrderCard({ order, isSelected }) {
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
          bgColor: 'bg-red-400', 
          statusText: 'READY',
          statusBg: 'bg-red-500'
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
      const elapsedSeconds = (order.initialDuration || 900) - remainingSeconds;
      return Math.max(0, Math.min(100, (elapsedSeconds / (order.initialDuration || 900)) * 100));
    } catch {
      return 0;
    }
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div 
      className={`${statusConfig.bgColor} rounded-2xl p-6 text-white relative transition-all duration-200 ${
        isSelected ? 'ring-4 ring-white shadow-2xl transform scale-105' : 'shadow-lg'
      } flex flex-col h-full min-h-[320px]`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">#{order.id}</h3>
          <p className="text-sm opacity-90">Table {order.table}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black bg-opacity-20">
          <div className={`w-2 h-2 ${statusConfig.statusBg} rounded-full`}></div>
          <span className="text-xs font-medium uppercase">{statusConfig.statusText}</span>
        </div>
      </div>

      {/* Time Section */}
      <div className="mb-6">
        <p className="text-xs opacity-75 mb-1 uppercase tracking-wide">Time Remaining</p>
        <p className="text-3xl font-bold mb-3">{getTimeDisplay(order)}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-black bg-opacity-20 rounded-full h-2 mb-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressPercentage(order)}%` }}
          ></div>
        </div>
        
        <p className="text-xs opacity-75">Started: {order.startTimeFormatted || order.startedAt}</p>
      </div>

      {/* Order Image Section - Flex grow para ocupar espacio restante */}
      <div className="border-2 border-dashed border-white border-opacity-40 rounded-lg p-6 text-center bg-black bg-opacity-10 flex-grow flex flex-col justify-center min-h-[120px]">
        <div className="w-10 h-10 bg-white bg-opacity-30 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-medium opacity-90">ORDER IMAGE</p>
        <p className="text-xs opacity-75">Capture Station</p>
      </div>
    </div>
  );
}