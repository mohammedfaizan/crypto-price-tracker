import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import type{ PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = "https://coinranking1.p.rapidapi.com";
const API_KEY = import.meta.env.VITE_API_KEY;


export const fetchCryptos = createAsyncThunk(
  "crypto/fetchCryptos",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/coins?limit=10`, {
        headers: { 
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch data');
      }

      const data = await response.json();
      return data.data.coins;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch data');
    }
  }
);


export const searchCoins = createAsyncThunk(
  "crypto/searchCoins",
  async (searchTerm: string, { rejectWithValue }) => {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      
      const searchResponse = await fetch(
        `${BASE_URL}/search-suggestions?query=${encodeURIComponent(searchTerm)}`, 
        {
          headers: { 
            'X-RapidAPI-Key': API_KEY,
            'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com'
          },
        }
      );

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.message || 'Failed to search coins');
      }

      const searchData = await searchResponse.json();
      const coins = searchData.data.coins || [];

      if (coins.length === 0) return [];

      
      const coinDetails = await Promise.all(
        coins.map(async (coin: any) => {
          try {
            const detailResponse = await fetch(
              `${BASE_URL}/coin/${coin.uuid}`, 
              {
                headers: { 
                  'X-RapidAPI-Key': API_KEY,
                  'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com'
                },
              }
            );

            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              return detailData.data.coin;
            }
            return coin; 
          } catch (error) {
            console.error(`Failed to fetch details for ${coin.name}:`, error);
            return coin; 
          }
        })
      );

      return coinDetails;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search coins');
    }
  }
);

interface CryptoState {
  coins: any[];
  filteredCoins: any[];
  searchTerm: string;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CryptoState = {
  coins: [],
  filteredCoins: [],
  searchTerm: "",
  status: "idle",
  error: null,
};

const cryptoSlice = createSlice({
  name: "crypto",
  initialState,
  reducers: {
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
      if (!action.payload.trim()) {
        
        state.filteredCoins = state.coins;
        state.error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCryptos.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCryptos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.coins = action.payload;
        if (!state.searchTerm.trim()) {
          state.filteredCoins = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchCryptos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string || "Failed to fetch data";
      })
      .addCase(searchCoins.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchCoins.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.filteredCoins = action.payload;
        state.error = null;
      })
      .addCase(searchCoins.rejected, (state, action) => {
        state.status = "failed";
        state.filteredCoins = [];
        state.error = action.payload as string || "Failed to search coins";
      });
  },
});

export const { setSearchTerm } = cryptoSlice.actions;
export default cryptoSlice.reducer;
