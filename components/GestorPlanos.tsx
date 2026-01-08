import React, { useState } from 'react';
import { Plan } from '../types';

interface Props {
  plans: Plan[];
  setPlans: (plans: Plan[]) => void;
}

const GestorPlanos: React.FC<Props> = ({ plans, setPlans }) => {
  const [newPlan, setNewPlan] = useState({ name: '', price: '', durationValue: '', durationUnit: 'months' as 'months' | 'days' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Plan | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const calculatePreviewDate = (val: number, unit: 'months' | 'days') => {
    const d = new Date();
    if (unit === 'months') {
      d.setMonth(d.getMonth() + val);
    } else {
      d.setDate(d.getDate() + val);
    }
    return d.toLocaleDateString('pt-BR');
  };

  const handleDateSelection = (selectedDateStr: string, isEditing: boolean) => {
    if (!selectedDateStr) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Ajuste para evitar problemas de fuso horário no seletor de data
    const selected = new Date(selectedDateStr + 'T00:00:00');
    selected.setHours(0, 0, 0, 0);

    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      alert("Selecione uma data futura.");
      return;
    }

    if (isEditing && editBuffer) {
      if (diffDays % 30 === 0) {
        setEditBuffer({ ...editBuffer, durationValue: diffDays / 30, durationUnit: 'months' });
      } else {
        setEditBuffer({ ...editBuffer, durationValue: diffDays, durationUnit: 'days' });
      }
    } else {
      if (diffDays % 30 === 0) {
        setNewPlan({ ...newPlan, durationValue: (diffDays / 30).toString(), durationUnit: 'months' });
      } else {
        setNewPlan({ ...newPlan, durationValue: diffDays.toString(), durationUnit: 'days' });
      }
    }
  };

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price || !newPlan.durationValue) {
      alert("Preencha todos os campos para criar o plano.");
      return;
    }

    const plan: Plan = {
      id: Date.now().toString(),
      name: newPlan.name,
      price: Number(newPlan.price),
      durationValue: Number(newPlan.durationValue),
      durationUnit: newPlan.durationUnit
    };

    setPlans([...plans, plan]);
    setNewPlan({ name: '', price: '', durationValue: '', durationUnit: 'months' });
  };

  const startEditing = (plan: Plan) => {
    setEditingId(plan.id);
    setEditBuffer({ ...plan });
  };

  const saveEdit = () => {
    if (!editBuffer) return;
    setPlans(plans.map(p => p.id === editBuffer.id ? editBuffer : p));
    setEditingId(null);
    setEditBuffer(null);
  };

  const removePlan = (id: string) => {
    if (window.confirm("Deseja excluir este plano permanentemente?")) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-fade-in space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Planos & <span className="text-blue-500">Preços</span></h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Defina a duração exata ou use o calendário</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <div className="lg:col-span-4">
          <div className="bg-[#141824] p-8 rounded-[40px] border border-gray-800 shadow-2xl space-y-6 sticky top-24">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✨</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Novo Plano Personalizado</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome do Plano</label>
                <input 
                  type="text" 
                  value={newPlan.name}
                  onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="Ex: Plano Trimestral"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Duração</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={newPlan.durationValue}
                      onChange={e => setNewPlan({...newPlan, durationValue: e.target.value})}
                      placeholder="3"
                      className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all pr-12"
                    />
                    
                    {/* Overlay de Calendário para disparar o seletor nativo ao clicar */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                      <span className="text-lg">📅</span>
                      <input 
                        type="date" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleDateSelection(e.target.value, false)}
                        onMouseEnter={() => setShowPreview('new')}
                        onMouseLeave={() => setShowPreview(null)}
                      />
                    </div>

                    {showPreview === 'new' && newPlan.durationValue && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-blue-600 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest z-50 shadow-2xl animate-fade-in text-center">
                        Vencimento estimado: {calculatePreviewDate(Number(newPlan.durationValue), newPlan.durationUnit)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unidade</label>
                  <select 
                    value={newPlan.durationUnit}
                    onChange={e => setNewPlan({...newPlan, durationUnit: e.target.value as any})}
                    className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none appearance-none"
                  >
                    <option value="months">Meses</option>
                    <option value="days">Dias</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Preço Final R$</label>
                <input 
                  type="number" 
                  value={newPlan.price}
                  onChange={e => setNewPlan({...newPlan, price: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleAddPlan}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Adicionar Plano
            </button>
          </div>
        </div>

        {/* LISTAGEM E EDIÇÃO DE PLANOS */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((p) => {
              const isEditing = editingId === p.id;
              const currentPlan = isEditing ? editBuffer! : p;
              
              // Fix: Access durationValue directly instead of non-existent months property
              const durationVal = currentPlan.durationValue || 0;
              const durationUnit = currentPlan.durationUnit || 'months';

              return (
                <div key={p.id} className={`bg-[#141824] p-8 rounded-[40px] border transition-all relative ${isEditing ? 'border-blue-600 ring-4 ring-blue-600/10' : 'border-gray-800'}`}>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${isEditing ? 'bg-blue-600 text-white' : 'bg-blue-600/10 text-blue-500'}`}>
                        {isEditing ? '✏️' : '💰'}
                      </div>
                      <div>
                        {isEditing ? (
                          <input 
                            value={editBuffer?.name}
                            onChange={e => setEditBuffer({...editBuffer!, name: e.target.value})}
                            className="bg-black/20 border-b border-blue-500 outline-none text-lg font-black text-white italic uppercase tracking-tighter w-full"
                          />
                        ) : (
                          <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{p.name}</h4>
                        )}
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          {isEditing ? 'Editando detalhes...' : `${durationVal} ${durationUnit === 'months' ? 'Mês(es)' : 'Dia(s)'}`}
                        </p>
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => startEditing(p)} className="text-[9px] font-black text-blue-500 uppercase hover:underline">Editar</button>
                        <button onClick={() => removePlan(p.id)} className="text-[9px] font-black text-red-500/50 uppercase hover:text-red-500">Excluir</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-600 uppercase">Duração</label>
                            <div className="relative">
                              <input 
                                type="number"
                                value={editBuffer?.durationValue}
                                onChange={e => setEditBuffer({...editBuffer!, durationValue: Number(e.target.value)})}
                                className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                              />
                               <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                                  <span className="text-sm">📅</span>
                                  <input 
                                    type="date" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => handleDateSelection(e.target.value, true)}
                                    onMouseEnter={() => setShowPreview(p.id)}
                                    onMouseLeave={() => setShowPreview(null)}
                                  />
                                </div>
                                {showPreview === p.id && (
                                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-900 border border-gray-700 text-blue-400 p-2 rounded-lg text-[9px] font-black uppercase text-center z-50 shadow-xl">
                                    Vence em: {calculatePreviewDate(editBuffer!.durationValue, editBuffer!.durationUnit)}
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-gray-600 uppercase">Unidade</label>
                            <select 
                              value={editBuffer?.durationUnit}
                              onChange={e => setEditBuffer({...editBuffer!, durationUnit: e.target.value as any})}
                              className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none appearance-none"
                            >
                              <option value="months">Meses</option>
                              <option value="days">Dias</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-600 uppercase">Preço (R$)</label>
                          <input 
                            type="number"
                            value={editBuffer?.price}
                            onChange={e => setEditBuffer({...editBuffer!, price: Number(e.target.value)})}
                            className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Salvar</button>
                           <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-black/20 p-4 rounded-2xl border border-gray-800/50">
                          <div className="flex justify-between items-end">
                            <span className="text-3xl font-black italic text-white">R$ {p.price}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${durationUnit === 'months' ? 'bg-blue-600/10 text-blue-500' : 'bg-green-600/10 text-green-500'}`}>
                              {durationUnit === 'months' ? 'Faturamento Mensal' : 'Faturamento por Dia'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest mt-4">
                           <span>Ref: {p.id.slice(-6)}</span>
                           <span className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600/20"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600/40"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600/60"></div>
                           </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {plans.length === 0 && (
            <div className="py-20 text-center opacity-20 border-2 border-dashed border-gray-800 rounded-[40px]">
               <span className="text-6xl block mb-4">💸</span>
               <p className="text-sm font-black uppercase tracking-widest">Nenhum plano cadastrado.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GestorPlanos;
