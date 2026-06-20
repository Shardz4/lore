import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Fingerprint } from "lucide-react";

interface FeedCardProps {
  insight: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

function renderTextWithBold(text: string) {
  // Regex to split on **bold** text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Also parse italic *word* if any
    const italicParts = part.split(/(\*[^*]+\*)/g);
    if (italicParts.length > 1) {
      return italicParts.map((subPart, j) => {
        if (subPart.startsWith("*") && subPart.endsWith("*")) {
          return <em key={j} className="italic text-slate-800">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
      });
    }
    return part;
  });
}

function parseMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  
  return lines.map((line, index) => {
    let trimmed = line.trim();
    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    // 1. Headers
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="text-sm font-semibold text-slate-800 mt-3 mb-1">
          {renderTextWithBold(trimmed.substring(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={index} className="text-sm font-bold text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1">
          {renderTextWithBold(trimmed.substring(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={index} className="text-base font-bold text-slate-900 mt-4 mb-2">
          {renderTextWithBold(trimmed.substring(2))}
        </h2>
      );
    }

    // 2. List items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      return (
        <li key={index} className="ml-4 list-disc text-sm text-slate-700 my-0.5 leading-relaxed">
          {renderTextWithBold(trimmed.substring(2))}
        </li>
      );
    }

    // 3. Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <div key={index} className="ml-2 my-1.5 text-sm text-slate-700 leading-relaxed font-semibold">
          <span className="text-emerald-600 mr-1.5">{numMatch[1]}.</span>
          <span className="font-normal text-slate-700">{renderTextWithBold(numMatch[2])}</span>
        </div>
      );
    }

    // 4. Standard paragraph
    return (
      <p key={index} className="text-sm text-slate-700 my-1 leading-relaxed">
        {renderTextWithBold(trimmed)}
      </p>
    );
  });
}

export function FeedCard({ insight, isSelected, onSelect }: FeedCardProps) {
  const isMock = insight.is_mock;
  const data = insight.insight;

  return (
    <Card className={`mb-6 bg-white border-slate-100 transition-all duration-300 hover:border-emerald-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] ${isSelected ? 'border-emerald-400 shadow-[0_5px_20px_rgba(16,185,129,0.15)] bg-emerald-50/30' : ''}`}>
      <CardHeader className="flex flex-row items-start space-x-4 pb-3">
        <Checkbox 
          className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" 
          checked={isSelected} 
          onCheckedChange={onSelect} 
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-emerald-500" />
              {data.insight_type}
            </CardTitle>
            {isMock && (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm">
                SIMULATED DATA
              </span>
            )}
          </div>
          <CardDescription className="text-slate-500 mt-1 flex items-center gap-1.5 font-mono text-xs">
            <Fingerprint className="w-3.5 h-3.5" />
            TRACE: {data.source_trace_id}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="ml-8">
        <p className="text-sm text-slate-600 mb-4 border-l-2 border-emerald-300 pl-3 py-1">
          <span className="text-slate-900 font-semibold">Metrics:</span> {data.description} <span className="text-emerald-600 font-medium">({data.event_count} Events)</span>
        </p>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-xs font-bold text-emerald-600 mb-2 tracking-wider uppercase">AI Summary</p>
          <div className="space-y-1">{parseMarkdown(insight.narrative)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

