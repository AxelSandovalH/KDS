// KDSLayout.jsx
import React, { useState, useEffect, useCallback } from 'react';
import OrderCard from './OrderCard';
import QueueSidebar from './QueueSidebar';
import io from 'socket.io-client';

// Utility to format time (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Connect to the Socket.IO server
const socket = io('http://localhost:5000');

export default function KDSLayout() {
  const [allOrders, setAllOrders] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const [displayStartIndex, setDisplayStartIndex] = useState(0);
  const MAX_DISPLAYED_ORDERS = 6;

  // Helper function to adjust displayStartIndex and selectedIndex
  const adjustDisplayWindow = useCallback((currentSelectedIndex, totalOrdersLength) => {
    if (totalOrdersLength === 0) {
      setSelectedIndex(0);
      setDisplayStartIndex(0);
      return;
    }

    const newSelectedIndex = Math.min(currentSelectedIndex, totalOrdersLength - 1);

    if (newSelectedIndex >= displayStartIndex + MAX_DISPLAYED_ORDERS) {
      setDisplayStartIndex(newSelectedIndex - MAX_DISPLAYED_ORDERS + 1);
    } else if (newSelectedIndex < displayStartIndex) {
      setDisplayStartIndex(newSelectedIndex);
    } else if (newSelectedIndex === displayStartIndex && displayStartIndex > 0) {
        setDisplayStartIndex(displayStartIndex - 1);
    } else if (newSelectedIndex === displayStartIndex + MAX_DISPLAYED_ORDERS -1 &&
               displayStartIndex + MAX_DISPLAYED_ORDERS < totalOrdersLength) {
        setDisplayStartIndex(displayStartIndex + 1);
    }

    setSelectedIndex(newSelectedIndex);
  }, [displayStartIndex, MAX_DISPLAYED_ORDERS]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('new_order', (newOrder) => {
      console.log('--- NEW_ORDER EVENT RECEIVED ---');
      console.log('New order data received (newOrder):', newOrder);

      setAllOrders(prevOrders => {
        const orderWithTimerInfo = {
          ...newOrder,
          startTime: Date.now(),
          initialDuration: newOrder.initialDuration || (15 * 60),
          status: newOrder.status || 'NEW',
        };
        console.log('Previous order state (prevOrders):', prevOrders);
        console.log('Formatted order to add (orderWithTimerInfo):', orderWithTimerInfo);

        const updatedOrders = [...prevOrders, orderWithTimerInfo];
        if (prevOrders.length === 0 && updatedOrders.length > 0) {
            adjustDisplayWindow(0, updatedOrders.length);
        } else {
            if (selectedIndex >= displayStartIndex + MAX_DISPLAYED_ORDERS) {
                 adjustDisplayWindow(selectedIndex, updatedOrders.length);
            }
        }
        return updatedOrders;
      });
    });

    socket.on('order_updated', (updatedOrder) => {
        console.log('Order updated received:', updatedOrder);
        setAllOrders(prevOrders => prevOrders.map(order =>
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        ));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('system_status', (statusData) => {
        console.log('System status received:', statusData);
    });

    return () => {
      socket.off('connect');
      socket.off('new_order');
      socket.off('order_updated');
      socket.off('disconnect');
      socket.off('system_status');
    };
  }, [allOrders.length, selectedIndex, displayStartIndex, adjustDisplayWindow]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAllOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.status === 'READY') {
            return order;
          }

          const elapsedSeconds = Math.floor((Date.now() - order.startTime) / 1000);
          let remainingSeconds = order.initialDuration - elapsedSeconds;
          let status = order.status;

          if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            status = 'OVERDUE';
          }
          else if (status === 'COOKING' && remainingSeconds <= 5 * 60) {
            status = 'ALMOST_DONE';
          }

          return {
            ...order,
            status,
            timeRemaining: formatTime(remainingSeconds),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const ordersToShowInGrid = allOrders.slice(displayStartIndex, displayStartIndex + MAX_DISPLAYED_ORDERS);

  const getRelativeSelectedIndex = useCallback((absoluteIndex) => {
    return absoluteIndex - displayStartIndex;
  }, [displayStartIndex]);

  const handleNext = useCallback(() => {
    if (allOrders.length === 0) return;

    const newSelectedIndex = (selectedIndex + 1) % allOrders.length;
    setSelectedIndex(newSelectedIndex);
    adjustDisplayWindow(newSelectedIndex, allOrders.length);
  }, [allOrders.length, selectedIndex, adjustDisplayWindow]);

  const handlePrevious = useCallback(() => {
    if (allOrders.length === 0) return;

    const newSelectedIndex = (selectedIndex - 1 + allOrders.length) % allOrders.length;
    setSelectedIndex(newSelectedIndex);
    adjustDisplayWindow(newSelectedIndex, allOrders.length);
  }, [allOrders.length, selectedIndex, adjustDisplayWindow]);

  const handleMarkDone = useCallback(() => {
    if (allOrders.length === 0 || selectedIndex < 0 || selectedIndex >= allOrders.length) return;

    const now = Date.now();
    const delta = now - lastEnterTime;

    const currentlySelectedOrder = allOrders[selectedIndex];

    if (delta < 300) {
      setAllOrders(prevOrders =>
        prevOrders.map((order, idx) =>
          idx === selectedIndex ? {
            ...order,
            status: 'ALMOST_DONE',
            initialDuration: 5 * 60,
            startTime: Date.now(),
          } : order
        )
      );
    } else {
      setAllOrders(prevOrders =>
        prevOrders.map((order, idx) =>
          idx === selectedIndex ? { ...order, status: 'READY' } : order
        )
      );

      setTimeout(() => {
        setAllOrders(prevOrders => {
          if (prevOrders[selectedIndex] && prevOrders[selectedIndex].status === 'READY') {
            const filteredOrders = prevOrders.filter((_, idx) => idx !== selectedIndex);

            let nextSelectedIndex = selectedIndex;
            if (nextSelectedIndex >= filteredOrders.length) {
                nextSelectedIndex = filteredOrders.length > 0 ? filteredOrders.length - 1 : 0;
            }

            adjustDisplayWindow(nextSelectedIndex, filteredOrders.length);

            return filteredOrders;
          }
          return prevOrders;
        });
      }, 300);
    }

    setLastEnterTime(now);
  }, [allOrders, selectedIndex, lastEnterTime, adjustDisplayWindow]);

  const handleResetTimer = useCallback(() => {
    if (allOrders.length === 0 || selectedIndex < 0 || selectedIndex >= allOrders.length) return;

    setAllOrders(prevOrders =>
      prevOrders.map((order, idx) =>
        idx === selectedIndex ? {
          ...order,
          status: 'COOKING',
          initialDuration: 15 * 60,
          startTime: Date.now(),
        } : order
      )
    );
  }, [allOrders, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'Enter') handleMarkDone();
      else if (e.key === 'r' || e.key === 'R') handleResetTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleMarkDone, handleResetTimer]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex justify-between items-center p-6 bg-gray-900">
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-mono">{getCurrentTime()}</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-6 p-6">
          {Array.from({ length: MAX_DISPLAYED_ORDERS }).map((_, gridIndex) => {
            const order = ordersToShowInGrid[gridIndex];
            const isSelected = getRelativeSelectedIndex(selectedIndex) === gridIndex;
            
            return order ? (
              <OrderCard
                key={order.id}
                order={order} // Pasamos el objeto order completo (contiene order.table)
                isSelected={isSelected}
                // Pasamos el número de mesa real de la orden para mostrar
                displayTableNumber={order.table}
              />
            ) : (
              <div key={`empty-${gridIndex}`} className="bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-gray-500 text-lg">Empty Slot</span>
              </div>
            );
          })}
        </main>

        <QueueSidebar
          queue={allOrders}
          displayedCount={MAX_DISPLAYED_ORDERS}
          className="w-64"
          selectedIndex={selectedIndex}
        />
      </div>
    </div>
  );
}