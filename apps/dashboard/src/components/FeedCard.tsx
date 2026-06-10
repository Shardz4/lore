import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Fingerprint } from "lucide-react";

interface FeedCardProps {
  insight: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function FeedCard({ insight, isSelected, onSelect }: FeedCardProps) {
  const isMock = insight.is_mock;
  const data = insight.insight;

  return (
    <Card className={`mb-6 bg-slate-900/40 border-slate-800 transition-all duration-300 hover:bg-slate-900/80 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] ${isSelected ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''}`}>
      <CardHeader className="flex flex-row items-start space-x-4 pb-3">
        <Checkbox 
          className="mt-1 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
          checked={isSelected} 
          onCheckedChange={onSelect} 
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
              {data.insight_type}
            </CardTitle>
            {isMock && (
              <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                SIMULATED DATA
              </span>
            )}
          </div>
          <CardDescription className="text-slate-400 mt-1 flex items-center gap-1.5 font-mono text-xs">
            <Fingerprint className="w-3.5 h-3.5" />
            TRACE: {data.source_trace_id}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="ml-8">
        <p className="text-sm text-slate-400 mb-4 border-l-2 border-indigo-500/30 pl-3 py-1">
          <span className="text-slate-300 font-medium">Metrics:</span> {data.description} <span className="text-indigo-400">({data.event_count} Events)</span>
        </p>
        <div className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs font-bold text-indigo-400 mb-2 tracking-wider uppercase">AI Generated Narrative</p>
          <p className="text-sm text-slate-200 leading-relaxed">{insight.narrative}</p>
        </div>
      </CardContent>
    </Card>
  );
}
