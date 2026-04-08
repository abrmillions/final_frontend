import React from "react";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, XCircle, AlertCircle, FileText, Search, Shield } from "lucide-react";

interface VerificationResultDisplayProps {
  details: string;
}

export const VerificationResultDisplay: React.FC<VerificationResultDisplayProps> = ({ details }) => {
  if (!details) return <p className="text-muted-foreground italic">No detailed analysis available.</p>;

  // Try to separate system messages from JSON content
  // Matches "Openrouter: {" or "Openrouter:{" or "Openrouter: \n{"
  const parts = details.split(/Openrouter:\s*/);
  const systemMessage = parts.length > 1 ? parts[0].trim() : "";
  const jsonString = parts.length > 1 ? parts[1].trim() : details.trim();

  let data: any = null;
  try {
    if (jsonString && jsonString.length > 2) {
      // If the jsonString starts with { it might be JSON
      if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
        data = JSON.parse(jsonString);
      } else {
          // Fallback: try to find the first '{' and last '}'
          const firstBrace = jsonString.indexOf('{');
          const lastBrace = jsonString.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const potentialJson = jsonString.substring(firstBrace, lastBrace + 1);
              if (potentialJson.length > 2) {
                data = JSON.parse(potentialJson);
              }
          }
      }
    }
  } catch (e) {
    console.warn("Failed to parse verification JSON (this is expected if AI returned plain text):", e);
  }

  if (!data) {
    return (
      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800">
        {details}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {systemMessage && (
        <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-800 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p className="leading-relaxed italic">{systemMessage}</p>
        </div>
      )}

      {/* Summary Section */}
      {data.summary && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-blue-600" />
            Document Summary
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border shadow-sm">
            {data.summary}
          </p>
        </div>
      )}

      {/* Recommendation & Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-2 min-w-0">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Final Recommendation</p>
          <div className="flex items-center gap-3">
            {data.finalRecommendation === "APPROVED" ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ) : data.finalRecommendation === "REJECTED" ? (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <span className={`text-base xs:text-lg font-black tracking-tight break-all ${
              data.finalRecommendation === "APPROVED" ? "text-green-700" : 
              data.finalRecommendation === "REJECTED" ? "text-red-700" : "text-amber-700"
            }`} title={data.finalRecommendation}>
              {data.finalRecommendation}
            </span>
          </div>
        </div>
        
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confidence Score</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  data.confidenceScore > 0.8 ? "bg-linear-to-r from-green-400 to-green-600" : 
                  data.confidenceScore > 0.5 ? "bg-linear-to-r from-amber-400 to-amber-600" : 
                  "bg-linear-to-r from-red-400 to-red-600"
                }`}
                style={{ width: `${(data.confidenceScore || 0) * 100}%` }}
              />
            </div>
            <span className="text-lg font-black text-slate-700">{(data.confidenceScore * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Extracted Entities */}
      {data.extractedEntities && Object.keys(data.extractedEntities).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Search className="w-4 h-4 text-indigo-600" />
            Extracted Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            {Object.entries(data.extractedEntities).map(([key, value]: [string, any]) => (
              value && key !== "identifier" && (
                <div key={key} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 truncate" title={String(value)}>
                    {String(value)}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Domain Validation */}
      {data.domainValidation?.checks?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Shield className="w-4 h-4 text-emerald-600" />
            Validation Checks
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {data.domainValidation.checks.map((check: any, idx: number) => (
              <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors group">
                <div className="mt-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">{check.rule}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Assessment & Authenticity */}
      {(data.qualityAssessment?.issues?.length > 0 || data.authenticityIndicators?.suspiciousPatterns?.length > 0) && (
        <div className="grid grid-cols-1 gap-4">
          {data.authenticityIndicators?.suspiciousPatterns?.length > 0 && (
             <div className="space-y-2">
                <h4 className="text-sm font-bold text-red-600">Suspicious Patterns</h4>
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg space-y-1">
                  {data.authenticityIndicators.suspiciousPatterns.map((p: string, i: number) => (
                    <div key={i} className="text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      {p}
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
