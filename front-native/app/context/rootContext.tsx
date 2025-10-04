import React, { createContext, useState, useContext, ReactNode } from 'react';

interface RootData {
  isLogged?: boolean;
}

interface RootContextType {
  data: RootData;
  updateData: (newData: Partial<RootData>) => void;
}

const RootContext = createContext<RootContextType | undefined>(undefined);

export const RootProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<RootData>({ isLogged: false });

  const updateData = (newData: Partial<RootData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <RootContext.Provider value={{ data, updateData }}>
      {children}
    </RootContext.Provider>
  );
};

export const useRootContext = () => {
  const context = useContext(RootContext);
  if (!context) throw new Error('useForm must be used within FormProvider');
  return context;
};
