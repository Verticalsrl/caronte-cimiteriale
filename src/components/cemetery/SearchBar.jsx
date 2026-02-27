import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function SearchBar({ onSearch }) {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    onSearch({ searchText, settore: '' });
  };

  const handleClear = () => {
    setSearchText('');
    onSearch({ searchText: '', settore: '' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 md:p-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Cerca per nome o cognome..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 h-12 text-base border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl"
          />
          {searchText && (
            <button
              onClick={() => { setSearchText(''); onSearch({ searchText: '', settore: '' }); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={handleSearch}
          className="h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
        >
          <Search className="h-4 w-4 mr-2" />
          Cerca
        </Button>
      </div>
    </div>
  );
}