import React, { useEffect, useState } from 'react';

export default function QueueSidebar({ 
  queue, 
  displayedCount = 6, 
  className, 
  selectedIndex,
  onOrderSelect 
}) {
  const [processedQueue, setProcessedQueue] = useState([]);

  // Sincronizar con la cola principal y calcular índices absolutos
  useEffect(() => {
    setProcessedQueue(
      queue.map((order, index) => ({
        ...order,
        absoluteIndex: index,
        isInMainGrid: index < displayedCount
      }))
    );
  }, [queue, displayedCount]);

  const getStatusConfig = (status) => {
    const config = {
      'NEW': { color: 'text-green-400', bgColor: 'bg-green-400' },
      'COOKING': { color: 'text-green-400', bgColor: 'bg-green-400' },
      'PREPARING': { color: 'text-green-400', bgColor: 'bg-green-400' },
      'ALMOST_DONE': { color: 'text-orange-400', bgColor: 'bg-orange-400' },
      'OVERDUE': { color: 'text-red-400', bgColor: 'bg-red-400' },
      'READY': { color: 'text-blue-400', bgColor: 'bg-blue-400' }
    };
    return config[status] || config['NEW'];
  };

  const handleOrderClick = (absoluteIndex) => {
    if (onOrderSelect) {
      onOrderSelect(absoluteIndex);
    }
  };

  return (
    <div className={`${className} bg-gray-800 text-white p-4 flex flex-col min-h-0`}>
      <h2 className="text-lg font-bold mb-4 uppercase tracking-wide sticky top-0 bg-gray-800 py-2 z-10">
        Queue ({queue.length - displayedCount > 0 ? queue.length - displayedCount : 0})
      </h2>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {processedQueue
          .filter(order => !order.isInMainGrid)
          .map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.absoluteIndex)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                ${order.absoluteIndex === selectedIndex ? 
                  'bg-blue-700 ring-2 ring-blue-400' : 
                  'bg-gray-700 hover:bg-gray-600'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${getStatusConfig(order.status).bgColor} rounded-full`}></div>
                <div>
                  <p className="font-medium text-sm">#{order.id.split('-')[1]}</p>
                  <p className="text-xs text-gray-400">Table {order.table}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono ${getStatusConfig(order.status).color}`}>
                  {order.status === 'OVERDUE' ? 'OVERDUE' : order.timeRemaining || '--:--'}
                </p>
              </div>
            </div>
          ))
        }

        {processedQueue.filter(order => !order.isInMainGrid).length === 0 && (
          <div className="text-center text-gray-500 py-6">
            <p className="text-sm">No orders waiting</p>
          </div>
        )}
      </div>
    </div>
  );
}