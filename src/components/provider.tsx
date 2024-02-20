'use client';
import { Dispatch, createContext, useContext, useEffect, useReducer, useState } from "react";

const IsClientCtx = createContext(false);

export const IsClientCtxProvider = ({ children }: any) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return (
    <IsClientCtx.Provider value={isClient}>{children}</IsClientCtx.Provider>
  );
};

export function useIsClient() {
  return useContext(IsClientCtx);
}

interface IState {
  lang: string;
}

const initialState: IState = {
  lang: "en"
}

const __internalState = createContext(initialState);
const __internalDispatch = createContext(undefined);

export const InternalStateProvider = ({ children }: any) => {
    const [state, dispatch] = useReducer((state: IState, newValue: IState) => ({ ...state, ...newValue }), initialState);
    return <__internalState.Provider value={state}>
      {/*no idea how to make this work with typescript*/}
      {/*@ts-ignore*/}
        <__internalDispatch.Provider value={dispatch}>
            {children}
        </__internalDispatch.Provider>
    </__internalState.Provider>
}

export const useInternalState : () => [ IState, Dispatch<IState> ] = () => [
    useContext(__internalState),
    // still no idea how to make this work with typescript
    //@ts-ignore
    useContext(__internalDispatch)
];