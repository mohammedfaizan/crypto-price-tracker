import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";

import storage from "redux-persist/lib/storage";
import cryptoReducer from "./cryptoSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["coins", "searchTerm", "filteredCoins"],
};

const persistedReducer = persistReducer(persistConfig, cryptoReducer);

export const store = configureStore({
  reducer: { crypto: persistedReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
