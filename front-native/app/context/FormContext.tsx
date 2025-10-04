import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface FormData {
  componentsIdentifiers: string[];
  componentIndex: number;
  data?: any;
}

interface FormContextType {
  data: FormData;
  updateData: (newData: Partial<FormData>) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: FormData;
}) => {
  const [data, setData] = useState<FormData>(
    initialState || { componentsIdentifiers: [], componentIndex: 0 },
  );

  const updateData = (newData: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <FormContext.Provider value={{ data, updateData }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error('useForm must be used within FormProvider');
  return context;
};
