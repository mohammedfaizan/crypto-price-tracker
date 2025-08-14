import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { fetchCryptos, searchCoins } from "../store/cryptoSlice";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Search, RefreshCw, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const CryptoTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filteredCoins, status, error, searchTerm } = useSelector(
    (state: RootState) => state.crypto
  );
  const [inputValue, setInputValue] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('cryptoSearchHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });

  
  useEffect(() => {
    dispatch(fetchCryptos());
    const interval = setInterval(() => dispatch(fetchCryptos()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cryptoSearchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        dispatch(searchCoins(inputValue.trim()));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, dispatch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (searchTerm.trim()) {
        await dispatch(searchCoins(searchTerm)).unwrap();
      } else {
        await dispatch(fetchCryptos()).unwrap();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

 
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(parseFloat(price));
  };

  const formatMarketCap = (value: string | undefined) => {
    if (!value) return '$0';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numValue);
  };

  const get24hVolume = (coin: any) => {
    return coin['24hVolume'] || coin.volume24h || coin['24h_volume'] || '0';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
      
        setSearchHistory(prev => {
          const newHistory = [inputValue.trim(), ...prev.filter(term => term !== inputValue.trim())];
          return newHistory.slice(0, 5);
        });
      }
      setInputValue('');
    }
  };

  
  const handleClearSearch = () => {
    setInputValue('');
    dispatch(fetchCryptos());
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Crypto Tracker
        </h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={status === 'loading' || isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", (status === 'loading' || isRefreshing) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10 pr-10"
          placeholder="Search by name or symbol..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </form>

      {/* Display search history */}
      {!inputValue && searchHistory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchHistory.map((term, index) => (
            <button
              key={index}
              onClick={() => {
                setInputValue(term);
                dispatch(searchCoins(term));
              }}
              className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {status === "loading" && !isRefreshing && (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        </Card>
      )}

      {!error && filteredCoins.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCoins.map((coin: any) => (
            <Card key={coin.uuid} className="p-4 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-gray-700/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {coin.iconUrl ? (
                    <img 
                      src={coin.iconUrl} 
                      alt={`${coin.name} icon`} 
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${coin.iconUrl ? 'hidden' : 'flex'}`}>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {coin.symbol.length > 5 
                        ? coin.symbol.substring(0, 4) + '..' 
                        : coin.symbol}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">{coin.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{coin.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold dark:text-white">{formatPrice(coin.price)}</div>
                  <div className={cn(
                    "text-sm font-medium flex items-center justify-end",
                    coin.change && coin.change.startsWith('-') ? 'text-red-500' : 'text-green-500'
                  )}>
                    {coin.change && (
                      <>
                        {coin.change.startsWith('-') ? (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(parseFloat(coin.change)).toFixed(2)}%
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Market Cap:</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMarketCap(coin.marketCap || coin.market_cap)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>24h Volume:</span>
                  <span className="font-medium dark:text-gray-200">
                    {formatMarketCap(get24hVolume(coin))}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!error && filteredCoins.length === 0 && status !== 'loading' && !inputValue.trim() && (
        <Card className="p-8 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">No cryptocurrencies found. Try searching for a specific coin.</p>
        </Card>
      )}

      {!error && filteredCoins.length === 0 && status !== 'loading' && inputValue.trim() && (
        <Card className="p-8 text-center bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">No results found for "{inputValue}"</p>
        </Card>
      )}
    </div>
  );
};

export default CryptoTracker;
