import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit'
});

const MermaidBlock = ({ chart }) => {
  const [svgCode, setSvgCode] = useState('');
  const [error, setError] = useState(null);
  const [id] = useState(() => `mermaid-${nanoid(6)}`);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      try {
        if (!chart) return;
        const cleanChart = String(chart).replace(/\n$/, '');
        setError(null);
        
        // mermaid.render returns an object with { svg } in newer versions
        const { svg } = await mermaid.render(id, cleanChart);
        
        if (isMounted) setSvgCode(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        if (isMounted) {
          setError(err?.message || "Invalid Mermaid syntax");
          // Remove the broken mermaid container injected by render
          const el = document.getElementById(id);
          if (el) el.remove();
        }
      }
    };
    
    renderChart();
    
    return () => { isMounted = false; };
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm overflow-hidden flex flex-col gap-2">
        <p className="font-semibold text-xs uppercase tracking-wider">Mermaid Parsing Error</p>
        <pre className="overflow-x-auto custom-scrollbar p-2 bg-black/20 rounded-md whitespace-pre-wrap font-mono text-[12px]">{error}</pre>
        <p className="text-xs opacity-70 mt-1">The AI generated a flowchart with invalid syntax.</p>
      </div>
    );
  }

  if (!svgCode) {
    return (
      <div className="my-6 p-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-[#1E1E1E] border border-white/5 border-dashed">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        <span className="text-xs text-zinc-500 tracking-wide font-medium">Drawing Diagram...</span>
      </div>
    );
  }

  return (
    <div className="my-6 p-4 rounded-xl bg-[#1E1E1E] border border-white/5 shadow-inner overflow-x-auto custom-scrollbar flex justify-center [&>svg]:max-w-none [&>svg]:w-auto group relative">
      <div dangerouslySetInnerHTML={{ __html: svgCode }} className="w-full flex justify-center" />
    </div>
  );
};

export default MermaidBlock;
