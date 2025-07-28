import React from 'react';

export default function QueueSidebar({ queue }) {
  return (
    <aside className="bg-slate-900 text-white w-64 p-4 space-y-2">
      <h3 className="text-lg font-bold">Queue</h3>
      {queue.map((item) => (
        <div key={item.id} className="flex justify-between text-sm">
          <span>Table #{item.table}</span>
          <span className="uppercase text-xs">{item.status}</span>
        </div>
      ))}
    </aside>
  );
}
