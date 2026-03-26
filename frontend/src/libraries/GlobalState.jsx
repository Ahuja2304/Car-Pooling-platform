import React, { createContext, useState } from "react";

const initialState = {
  // mapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  endPoint: import.meta.env.VITE_END_POINT
}

export const GlobalContext = createContext();

const GlobalState = ({children}) => {
  const [globalSate, setGlobalState] = useState(initialState);
  return (
    <GlobalContext.Provider value={[globalSate, setGlobalState]}>
      {children}
    </GlobalContext.Provider>
  )
}
export default GlobalState;