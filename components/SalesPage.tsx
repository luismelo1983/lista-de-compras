
import React from 'react';
import { IconLogo, IconCheck, IconArrowLeft } from './Icons';

const SalesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const plans = [
    { 
      name: 'Degustação', 
      price: 'R$ 0,00', 
      desc: '7 dias experimentais', 
      features: ['1 Master + 1 Membro', 'Até 3 Listas', 'Uso Essencial', 'Sem Suporte'] 
    },
    { 
      name: 'Mensal', 
      price: 'R$ 14,90', 
      desc: 'Ideal para o dia a dia', 
      features: ['1 Master + 3 Membros', 'Listas Ilimitadas', 'Suporte Técnico', 'Integração WhatsApp'] 
    },
    { 
      name: 'Anual', 
      price: 'R$ 9,90', 
      period: '/mês',
      desc: '33% de Desconto Real', 
      features: ['1 Master + 5 Membros', 'Listas Ilimitadas', 'Suporte Prioritário', 'Integração WhatsApp'] 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-500">
        <nav className="p-4 flex items-center justify-between bg-white border-b sticky top-0 z-20">
            <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase"><IconArrowLeft className="w-4 h-4" /> Voltar</button>
            <div className="flex items-center gap-2">
                <IconLogo className="w-8 h-8" />
                <span className="font-black text-xl tracking-tighter">aLista</span>
            </div>
            <div className="w-20"></div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">O poder das listas <br/><span className="text-indigo-600">em suas mãos.</span></h1>
                <p className="text-slate-500 max-w-lg mx-auto font-medium">Gerencie compras, tarefas e estoque da sua casa de forma colaborativa e organizada.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((p, i) => (
                    <div key={p.name} className={`bg-white p-8 rounded-3xl shadow-xl border flex flex-col ${i === 1 ? 'border-indigo-500 ring-4 ring-indigo-50 scale-105 z-10' : 'border-slate-100'}`}>
                        <h3 className="font-black text-xl text-slate-800 mb-1">{p.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">{p.desc}</p>
                        <div className="text-3xl font-black text-indigo-600 mb-2">
                            {p.price}
                            {p.period && <span className="text-sm text-slate-400 font-bold">{p.period}</span>}
                        </div>
                        {p.name === 'Anual' && <p className="text-[9px] text-slate-400 font-bold mb-6 italic">*cobrado anualmente R$ 118,80</p>}
                        {p.name !== 'Anual' && <div className="mb-6 h-4"></div>}
                        
                        <ul className="space-y-3 mb-10 flex-1">
                            {p.features.map(f => (
                                <li key={f} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <IconCheck className="w-4 h-4 text-emerald-500" /> {f}
                                </li>
                            ))}
                        </ul>

                        <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${i === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            Assinar {p.name}
                        </button>
                    </div>
                ))}
            </div>

            <footer className="text-center pt-12 text-[10px] text-slate-400 font-black uppercase tracking-widest pb-12">
                &copy; 2025 Astro Technology. Todos os direitos reservados.
            </footer>
        </main>
    </div>
  );
};

export default SalesPage;
