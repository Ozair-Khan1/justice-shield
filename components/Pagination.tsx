"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
        Showing <span className="text-titanium-300">{startItem}</span> to{" "}
        <span className="text-titanium-300">{endItem}</span> of{" "}
        <span className="text-titanium-300">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex size-8 items-center justify-center rounded-sm border border-titanium-800 bg-titanium-900/50 text-titanium-400 transition-all hover:border-titanium-700 hover:text-titanium-100 disabled:opacity-30 disabled:hover:border-titanium-800"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPageNumbers().map((page, i) => (
          <button
            key={i}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..." || page === currentPage}
            className={`flex size-8 items-center justify-center rounded-sm font-mono text-[10px] transition-all ${page === currentPage
                ? "bg-action text-action-foreground font-bold"
                : page === "..."
                  ? "text-titanium-600 cursor-default"
                  : "border border-titanium-800 bg-titanium-900/50 text-titanium-400 hover:border-titanium-700 hover:text-titanium-100"
              }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex size-8 items-center justify-center rounded-sm border border-titanium-800 bg-titanium-900/50 text-titanium-400 transition-all hover:border-titanium-700 hover:text-titanium-100 disabled:opacity-30 disabled:hover:border-titanium-800"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
