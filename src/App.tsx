import React from "react";
import CryptoTracker from "./components/CryptoTracker";

const App = () => {
  return (
    <div>
      <h1 className="text-center text-2xl font-bold my-4">
        Crypto Price Tracker
      </h1>
      <CryptoTracker />
    </div>
  );
};

export default App;
