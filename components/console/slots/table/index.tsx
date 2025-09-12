import { Separator } from "@/components/ui/separator";
import TableBlock from "@/components/blocks/table";
import { Table as TableSlotType } from "@/types/slots/table";
import Toolbar from "@/components/blocks/toolbar";

export default function ({ ...table }: TableSlotType) {
  return (
    <div className="space-y-6">
      {table.title && (
        <div>
          <h3 className="text-lg font-medium text-white">{table.title}</h3>
          <p className="text-sm text-white/70">{table.description}</p>
        </div>
      )}
      {table.tip && (
        <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
          <p className="text-sm text-white/80">
            {table.tip.description || table.tip.title}
          </p>
        </div>
      )}
      {table.toolbar && <Toolbar items={table.toolbar.items} />}
      <div className="h-px bg-white/10" />
      <TableBlock {...table} />
    </div>
  );
}
