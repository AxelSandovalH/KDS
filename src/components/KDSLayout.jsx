import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import QueueSidebar from './QueueSidebar';
import ordersData from '../data/mockOrders';

// Utilidad para formatear el tiempo (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function KDSLayout() {
  const [allOrders, setAllOrders] = useState(
    ordersData.map((order, index) => ({
      ...order,
      startTime: Date.now(),
      status: order.status || 'COOKING',
      initialDuration: 15 * 60,
      startTimeFormatted: order.startedAt,
    }))
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastEnterTime, setLastEnterTime] = useState(0);

  // Las primeras 6 órdenes se muestran en el grid principal
  const displayedOrders = allOrders.slice(0, 6);
  // Las demás van al queue
  const queueOrders = allOrders.slice(6);

  // Efecto para actualizar timers cada segundo
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

          // Lógica para estados OVERDUE - rojo
          if (remainingSeconds <= 0) {
            remainingSeconds = 0;
            status = 'OVERDUE';
          }

          // Lógica para ALMOST_DONE (5 minutos restantes) - naranja
          if (status === 'COOKING' && remainingSeconds <= 5 * 60) {
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

  const handleNext = () => {
    if (displayedOrders.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % displayedOrders.length);
  };

  const handlePrevious = () => {
    if (displayedOrders.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + displayedOrders.length) % displayedOrders.length);
  };

  const handleMarkDone = () => {
    if (displayedOrders.length === 0) return;
    
    const now = Date.now();
    const delta = now - lastEnterTime;

    if (delta < 300) { // Doble click en 300ms
      setAllOrders(prevOrders => 
        prevOrders.map((order, idx) => 
          idx === selectedIndex ? {
            ...order,
            status: 'ALMOST_DONE',
            initialDuration: 5 * 60, // Reset a 5 minutos
            startTime: Date.now(), // Reiniciamos el timer
          } : order
        )
      );
    } else {
      // Primer clic - marcar como READY
      setAllOrders(prevOrders => 
        prevOrders.map((order, idx) => 
          idx === selectedIndex ? { ...order, status: 'READY' } : order
        )
      );
      
      // Esperar 300ms para verificar si hay doble clic antes de eliminar
      setTimeout(() => {
        setAllOrders(prevOrders => {
          // Verificar si la orden aún existe y está en READY
          if (prevOrders[selectedIndex] && prevOrders[selectedIndex].status === 'READY') {
            const filteredOrders = prevOrders.filter((_, idx) => idx !== selectedIndex);
            
            // Ajustar el índice seleccionado si es necesario
            const newDisplayedCount = Math.min(6, filteredOrders.length);
            if (newDisplayedCount > 0) {
              setSelectedIndex(prev => {
                if (prev >= newDisplayedCount) {
                  return newDisplayedCount - 1;
                }
                return prev;
              });
            } else {
              setSelectedIndex(0);
            }
            
            return filteredOrders;
          }
          return prevOrders;
        });
      }, 300); // Esperar el tiempo del doble clic antes de eliminar
    }

    setLastEnterTime(now);
  };

  // Resetear timer de la orden seleccionada
  const handleResetTimer = () => {
    if (displayedOrders.length === 0) return;
    
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
  };

  // Teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'Enter') handleMarkDone();
      else if (e.key === 'r' || e.key === 'R') handleResetTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allOrders, selectedIndex, lastEnterTime]);

  // Obtener la hora actual
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-gray-900">
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-mono">{getCurrentTime()}</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main Grid - Solo las primeras 6 órdenes */}
        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-6 p-6">
          {displayedOrders.map((order, idx) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              isSelected={idx === selectedIndex}
              onResetTimer={handleResetTimer}
            />
          ))}
          
          {/* Rellenar espacios vacíos si hay menos de 6 órdenes */}
          {Array.from({ length: Math.max(0, 6 - displayedOrders.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Empty Slot</span>
            </div>
          ))}
        </main>
        
        {/* Queue Sidebar - Todas las órdenes (primeras 6 + queue) */}
        <QueueSidebar queue={allOrders} displayedCount={6} />
      </div>
    </div>
  );
}