import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

export default function SearchBar({ onSearch, settori = [] }) {
  const [searchText, setSearchText] = useState('');
  const [settore, setSettore] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({ searchText, settore });
  };

  const handleClear = () => {
    setSearchText('');
    setSettore('');
    onSearch({ searchText: '', settore: '' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-3">
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
              onClick={() => setSearchText('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden h-12 border-slate-200"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtri
        </Button>

        <div className={`${showFilters ? 'flex' : 'hidden'} md:flex gap-3`}>
          <Select value={settore} onValueChange={setSettore}>
            <SelectTrigger className="w-full md:w-40 h-12 border-slate-200 rounded-xl">
              <SelectValue placeholder="Settore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i settori</SelectItem>
              {settori.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSearch}
            className="h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
          >
            <Search className="h-4 w-4 mr-2" />
            Cerca
          </Button>

          {(searchText || settore) && (
            <Button 
              variant="ghost" 
              onClick={handleClear}
              className="h-12 text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}