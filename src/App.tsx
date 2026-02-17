import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Rata {
  numero: number;
  data: string;
  totale: number;
  capitale: number;
  interessi: number;
  residuo: number;
}

function App() {
  const [importo, setImporto] = useState<string>('');
  const [rateNum, setRateNum] = useState<string>('18');
  const [piano, setPiano] = useState<Rata[]>([]);
  const [isMaxRate, setIsMaxRate] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fEuro = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  const getFineMese = (anno: number, mese: number): Date => new Date(anno, mese + 1, 0);

  const handlePrint = () => window.print();
  const handlePdf = () => {
    if (piano.length === 0) return;
    const doc = new jsPDF();
    doc.text('Piano Ammortamento Rottamazione Quinquies', 14, 20);
    doc.text(`Debito: ${fEuro(parseFloat(importo.replace(/\./g, '').replace(',', '.')))}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['#', 'Scadenza', 'Rata', 'Capitale', 'Interessi', 'Residuo']],
      body: piano.map(r => [r.numero, r.data, fEuro(r.totale), fEuro(r.capitale), fEuro(r.interessi), fEuro(r.residuo)]),
    });
    doc.save('piano-rottamazione.pdf');
  };

  const handleRateChange = (val: string) => {
    setRateNum(val);
    setIsMaxRate(val === '54');
    setErrorMsg(null);
  };

  const toggleMaxRate = () => {
    setRateNum(isMaxRate ? '18' : '54');
    setIsMaxRate(!isMaxRate);
    setErrorMsg(null);
  };

  const calcola = () => {
    setErrorMsg(null);
    const P = parseFloat(importo.replace(/\./g, '').replace(',', '.'));
    const N = parseInt(rateNum);

    if (!P || !N || N > 54) {
      setErrorMsg("Inserisci un importo valido e numero rate (max 54)");
      return;
    }

    // Controllo rata minima 100€
    const rataStimata = P / N;
    if (rataStimata < 100) {
       const maxRatePossibili = Math.floor(P / 100);
       const rateSuggerite = Math.max(1, maxRatePossibili);
       setErrorMsg(`Errore: La rata non può essere inferiore a 100,00€. Con questo importo puoi selezionare al massimo ${rateSuggerite} rate.`);
       setPiano([]);
       return;
    }

    const r_annuo = 0.03;
    const r_bimestrale = r_annuo / 6;

    // --- NUOVA LOGICA: Rata 1 pulita, Rate 2-N costanti ---
    
    let residuo = P;
    const pianoTemp: Rata[] = [];
    let meseCorrente = 6; 
    let annoCorrente = 2026;

    // RATA 1: Solo capitale (es. 1000/10 = 100.00€)
    const rata1 = P / N;
    residuo -= rata1;

    pianoTemp.push({
      numero: 1,
      data: getFineMese(2026, 6).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }),
      totale: rata1,
      capitale: rata1,
      interessi: 0,
      residuo: residuo
    });

    // RATE 2-N: Ammortamento francese sul residuo
    const rateRimaste = N - 1;
    let rataCostante = 0;
    
    if (rateRimaste > 0) {
      if (r_bimestrale === 0) {
        rataCostante = residuo / rateRimaste;
      } else {
        // Formula francese su residuo
        rataCostante = residuo * (r_bimestrale * Math.pow(1 + r_bimestrale, rateRimaste)) / (Math.pow(1 + r_bimestrale, rateRimaste) - 1);
      }

      meseCorrente = 6;
      annoCorrente = 2026;

      for (let i = 2; i <= N; i++) {
        // Calcolo date (salta luglio, parte da settembre)
        meseCorrente += 2;
        if (meseCorrente > 11) {
          meseCorrente -= 12;
          annoCorrente += 1;
        }
        const dataScadenza = getFineMese(annoCorrente, meseCorrente);

        // Calcolo interessi sul residuo
        const quotaInteressi = residuo * r_bimestrale;
        let quotaCapitale = rataCostante - quotaInteressi;

        // Gestione ultima rata per chiudere esattamente a zero
        if (i === N) {
          quotaCapitale = residuo;
          rataCostante = quotaCapitale + quotaInteressi; // Aggiusta ultima rata
        }

        residuo -= quotaCapitale;
        if (residuo < 0.001) residuo = 0;

        pianoTemp.push({
          numero: i,
          data: dataScadenza.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }),
          totale: rataCostante,
          capitale: quotaCapitale,
          interessi: quotaInteressi,
          residuo: residuo
        });
      }
    }

    setPiano(pianoTemp);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative overflow-hidden print:bg-white print:p-0">
      
      {/* Background Liquid */}
      <div className="fixed inset-0 z-0 pointer-events-none print:hidden overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/30 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Header Glass */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Rottamazione Quinquies</h1>
            <p className="text-xs text-slate-500 font-medium">Simulazione piano di ammortamento</p>
          </div>
          <div className="flex gap-2">
             <button onClick={handlePrint} disabled={piano.length === 0} className="p-2.5 rounded-full bg-white/50 hover:bg-white/80 border border-white/40 shadow-sm text-blue-600 disabled:opacity-50 transition active:scale-95">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
             </button>
             <button onClick={handlePdf} disabled={piano.length === 0} className="p-2.5 rounded-full bg-white/50 hover:bg-white/80 border border-white/40 shadow-sm text-indigo-600 disabled:opacity-50 transition active:scale-95">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 relative z-10 print:p-0">
        
        {/* Input Card Glass */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/50 p-6 mb-8 print:hidden ring-1 ring-black/5">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Debito Residuo</label>
              <div className="relative group">
                <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">€</span>
                <input type="tel" inputMode="decimal" placeholder="0,00" className="w-full pl-10 pr-4 py-4 bg-white/50 border border-white/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-2xl font-bold text-slate-800 shadow-inner placeholder:text-slate-300 transition-all" value={importo} onChange={(e) => setImporto(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Numero Rate</label>
                <input type="tel" inputMode="numeric" max={54} className="w-full px-4 py-4 bg-white/50 border border-white/60 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-2xl font-bold text-slate-800 shadow-inner transition-all" value={rateNum} onChange={(e) => handleRateChange(e.target.value)} />
              </div>
              <button onClick={toggleMaxRate} className={`h-[64px] w-[64px] rounded-xl border flex flex-col justify-center items-center transition-all active:scale-95 shadow-sm ${isMaxRate ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white/60'}`}>
                <span className="font-bold text-sm">Max</span><span className="text-[10px] font-medium opacity-80">54</span>
              </button>
            </div>
            
            {/* Messaggio Errore */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-pulse">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <button onClick={calcola} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all text-lg mt-2 flex justify-center items-center gap-2">
              <span>Genera Piano</span>
            </button>
          </div>
        </div>

        {/* Risultati */}
        {piano.length > 0 && !errorMsg && (
          <div className="space-y-4 print:block animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Info Badge */}
             <div className="flex justify-between items-center px-4 py-3 bg-white/40 backdrop-blur-md rounded-full border border-white/30 shadow-sm mb-4 print:hidden mx-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{piano.length} Rate</span>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-400 font-medium">Prima rata</span>
                 <span className="text-lg font-bold text-blue-600">{fEuro(piano[0].totale)}</span>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 print:hidden pb-10">
              {piano.map((r) => (
                <div key={r.numero} className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/40 flex justify-between items-center relative overflow-hidden group active:scale-[0.99] transition-transform">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-200/50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white/50">#{r.numero}</span>
                      <span className="text-sm font-bold text-slate-700">{r.data}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium flex gap-2 mt-1">
                      <span>Cap: {fEuro(r.capitale)}</span><span className="w-px h-3 bg-slate-300"></span><span>Int: {fEuro(r.interessi)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600 tracking-tight">{fEuro(r.totale)}</div>
                    <div className="text-[10px] text-slate-400 font-medium bg-slate-100/50 px-1.5 py-0.5 rounded-md inline-block mt-1">Res: {fEuro(r.residuo)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block print:block overflow-hidden rounded-2xl border border-white/40 bg-white/40 backdrop-blur-xl shadow-lg print:border-none print:shadow-none print:bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/50 text-xs uppercase text-slate-500 font-bold border-b border-white/30 print:border-black print:text-black">
                  <tr>
                    <th className="px-6 py-4 text-center w-16">#</th>
                    <th className="px-6 py-4">Scadenza</th>
                    <th className="px-6 py-4 text-right text-blue-700 print:text-black">Rata</th>
                    <th className="px-6 py-4 text-right text-slate-500 print:text-black">Capitale</th>
                    <th className="px-6 py-4 text-right text-orange-600 print:text-black">Interessi</th>
                    <th className="px-6 py-4 text-right text-slate-400 print:text-black">Residuo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30 print:divide-black">
                  {piano.map((r, idx) => (
                    <tr key={r.numero} className={`hover:bg-white/40 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : 'bg-transparent'} print:bg-white`}>
                      <td className="px-6 py-4 text-center font-bold text-slate-400 print:text-black">{r.numero}</td>
                      <td className="px-6 py-4 font-medium text-slate-700 print:text-black">{r.data}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 print:text-black">{fEuro(r.totale)}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-500 print:text-black">{fEuro(r.capitale)}</td>
                      <td className="px-6 py-4 text-right font-mono text-orange-500 print:text-black">{fEuro(r.interessi)}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400 print:text-black">{fEuro(r.residuo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
