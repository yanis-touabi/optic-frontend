import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Option { value: string; label: string; description: string }

export function TemplateSelect({
  value, onChange, options, label = "Modèle d'impression",
}: { value: string; onChange: (v: string) => void; options: Option[]; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs whitespace-nowrap">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <div>
                <div className="font-medium">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
