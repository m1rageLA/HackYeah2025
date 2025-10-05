import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export interface FormData {
  componentsIdentifiers: string[];
  componentIndex: number;
  data?: Record<string, unknown>;
  category: string;
}

export type FormUpdater =
  | Partial<FormData>
  | ((previous: FormData) => Partial<FormData>);

interface FormContextType {
  data: FormData;
  updateData: (updater: FormUpdater) => void;
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
    initialState || {
      componentsIdentifiers: [],
      componentIndex: 0,
      category: '',
    },
  );

  const updateData = useCallback((updater: FormUpdater) => {
    setData((previous) => {
      const patch = typeof updater === 'function' ? updater(previous) : updater;
      return { ...previous, ...patch };
    });
  }, []);

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
