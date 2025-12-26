
import React, { useState } from 'react';
import { Client, Server, ViewType } from '../types';

interface Props {
  clients: Client[];
  servers: Server[];
  onNavigate: (view: ViewType) => void;
}

const GestorCalendario: React.FC<Props> = ({ clients, servers, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dias no mês atual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Primeiro dia da semana (0-6)
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getClientsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return clients.filter(c => c.expirationDate === dateStr);
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const expiringToday = clients.filter(c => c.expirationDate === selectedDateStr);

  return (
    <div className="p-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO ESQUERDO: O CALENDÁRIO */}
        <div className="lg:col-span-8 bg-[#141824] rounded-[32px] border border-gray-800 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-white capitalize tracking-tight">
              {monthNames[month]} <span className="text-gray-500 font-medium ml-1">de {year}</span>
            </h2>
            <div className="flex gap-4">
              <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-all text-gray-400">
                &lt;
              </button>
              <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-all text-gray-400">
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-800/50">
            {/* Cabeçalho dias da semana */}
            {daysOfWeek.map(day => (
              <div key={day} className="bg-[#0b0e14] py-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{day}</span>
              </div>
            ))}

            {/* Espaços vazios do mês anterior */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[#141824] h-24 border border-gray-800/20 opacity-20"></div>
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasClients = getClientsForDay(day).length > 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative h-24 bg-[#141824] border border-gray-800/20 transition-all hover:bg-white/[0.02] flex flex-col items-center justify-center group
                    ${isSelected ? 'ring-2 ring-blue-600 z-10' : ''}
                  `}
                >
                  <span className={`text-lg font-black ${isSelected ? 'text-blue-500' : 'text-gray-500'} ${hasClients && !isSelected ? 'text-gray-300' : ''}`}>
                    {day}
                  </span>
                  
                  {hasClients && (
                    <div className="mt-1 flex gap-1 justify-center">
                      <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-blue-600 animate-pulse'}`}></div>
                    </div>
                  )}

                  {hasClients && (
                    <div className="absolute top-2 right-2">
                       <span className="text-[8px] font-black bg-blue-600/20 text-blue-500 px-1.5 rounded-md border border-blue-500/10">
                        {getClientsForDay(day).length}
                       </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* LADO DIREITO: DETALHES DO DIA SELECIONADO */}
        <div className="lg:col-span-4 bg-[#141824] rounded-[32px] border border-gray-800 p-8 shadow-2xl flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              🕒
            </div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">
              Expira em <span className="text-blue-500">{selectedDay}</span>
            </h3>
          </div>

          <div className="flex-1 space-y-4">
            {expiringToday.length > 0 ? (
              expiringToday.map(c => (
                <div key={c.id} className="bg-black/40 border border-gray-800 rounded-2xl p-4 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                  <div>
                    <p className="font-bold text-sm text-white">{c.name}</p>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      {servers.find(s => s.id === c.serverId)?.name || 'Sem Servidor'}
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate('gestor-template-ai')}
                    className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs"
                    title="Cobrar agora"
                  >
                    📲
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-30">
                <span className="text-5xl mb-4">📅</span>
                <p className="text-sm font-black uppercase tracking-widest max-w-[200px]">Não há datas de validade para hoje.</p>
              </div>
            )}
          </div>

          {expiringToday.length > 0 && (
             <div className="pt-6 border-t border-gray-800 mt-auto">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Total de {expiringToday.length} vencimentos neste dia</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GestorCalendario;
