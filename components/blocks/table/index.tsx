import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Copy from "./copy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { TableColumn } from "@/types/blocks/table";

export default function ({
  columns,
  data,
  empty_message,
}: {
  columns?: TableColumn[];
  data?: any[];
  empty_message?: string;
}) {
  if (!columns) {
    columns = [];
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            {columns &&
              columns.map((item: TableColumn, idx: number) => {
                return (
                  <TableHead key={idx} className={`text-white/80 font-medium ${item.className}`}>
                    {item.title}
                  </TableHead>
                );
              })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((item: any, idx: number) => (
              <TableRow key={idx} className="border-white/10 hover:bg-white/5">
                {columns &&
                  columns.map((column: TableColumn, iidx: number) => {
                    const content = column.callback
                      ? column.callback(item)
                      : item[column.name as keyof typeof item];
                    const value = item[column.name as keyof typeof item];

                    if (column.type === "copy" && value) {
                      return (
                        <TableCell key={iidx} className={`text-white/90 ${column.className}`}>
                          <Copy text={value}>{content}</Copy>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={iidx} className={`text-white/90 ${column.className}`}>
                        {content}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))
          ) : (
            <TableRow className="border-white/10">
              <TableCell colSpan={columns.length}>
                <div className="flex w-full justify-center items-center py-8 text-white/50">
                  <p>{empty_message}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
