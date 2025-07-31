// QueueSidebar.jsx
import React from 'react';

export default function QueueSidebar({ queue, displayedCount = 6, className, selectedIndex }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'NEW':
      case 'COOKING':
      case 'PREPARING':
        return { color: 'text-green-400', bgColor: 'bg-green-400' };
      case 'ALMOST_DONE':
        return { color: 'text-orange-400', bgColor: 'bg-orange-400' };
      case 'OVERDUE':
        return { color: 'text-red-400', bgColor: 'bg-red-400' };
      case 'READY':
        return { color: 'text-blue-400', bgColor: 'bg-blue-400' };
      default:
        return { color: 'text-green-400', bgColor: 'bg-green-400' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'NEW':
      case 'COOKING':
      case 'PREPARING':
        return 'COOKING';
      case 'ALMOST_DONE':
        return 'ALMOST DONE';
      case 'OVERDUE':
        return 'OVERDUE';
      case 'READY':
        return 'READY';
      default:
        return 'COOKING';
    }
  };

  const getTimeDisplay = (order) => {
    if (order.status === 'OVERDUE') return 'OVERDUE';
    return order.timeRemaining || '15:00';
  };

  return (
    <div className={`${className} bg-gray-800 text-white p-6 flex flex-col min-h-0`}>
      <h2 className="text-lg font-bold mb-6 uppercase tracking-wide">Queue</h2>

      <div className="space-y-3 flex-1 max-h-full overflow-y-auto hide-scrollbar">
        {queue.map((order, index) => { // 'index' here is the position in the 'queue' array
          const statusConfig = getStatusConfig(order.status);
          const isInMainGrid = index < displayedCount;
          const isCurrentlySelected = index === selectedIndex;
          const queueNumber = index + 1; // This will be the consecutive queue number

          return (
            <div
              key={order.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors
                ${isCurrentlySelected ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}
                ${isInMainGrid && !isCurrentlySelected ? 'border-l-4 border-blue-400' : ''}
              `}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Displays the consecutive queue number */}
                  <p className="font-medium text-white">QUEUE #{queueNumber}</p>
                  {isInMainGrid && (
                    <span className={`text-xs ${isCurrentlySelected ? 'bg-blue-400' : 'bg-blue-500'} text-white px-2 py-1 rounded-full`}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-sm ${statusConfig.color}`}>
                  <div className={`w-2 h-2 ${statusConfig.bgColor} rounded-full`}></div>
                  <span className="uppercase font-medium">{getStatusText(order.status)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300 font-mono">
                  {getTimeDisplay(order)}
                </p>
                <p className="text-xs text-gray-400">
                  {order.startTimeFormatted || order.startedAt}
                </p>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No orders in queue</p>
          </div>
        )}
      </div>
    </div>
  );
}