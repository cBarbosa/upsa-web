import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para verificar se o componente ainda está montado
 * Previne atualizações de estado em componentes desmontados
 */
export const useIsMounted = () => {
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return useCallback(() => isMountedRef.current, []);
};

/**
 * Hook para executar setState apenas se o componente estiver montado
 */
export const useSafeState = <T>(initialState: T): [T, (newState: T | ((prev: T) => T)) => void] => {
    const [state, setState] = React.useState<T>(initialState);
    const isMounted = useIsMounted();

    const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
        if (isMounted()) {
            setState(newState);
        }
    }, [isMounted]);

    return [state, safeSetState];
};

export default useIsMounted; 