import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { logger } from '../utils/logger';

interface NavigationOptions {
    replace?: boolean;
    shallow?: boolean;
}

export const useNavigation = () => {
    const router = useRouter();

    const navigateTo = useCallback(async (
        path: string, 
        options: NavigationOptions = {}
    ) => {
        try {
            const { replace = false, shallow = false } = options;
            
            if (replace) {
                await router.replace(path, undefined, { shallow });
            } else {
                await router.push(path, undefined, { shallow });
            }
        } catch (error) {
            logger.error(`Navigation failed to ${path}`, error);
            
            // Fallback navigation
            try {
                window.location.href = path;
            } catch (fallbackError) {
                logger.error('Fallback navigation also failed', fallbackError);
            }
        }
    }, [router]);

    const navigateBack = useCallback(() => {
        try {
            if (window.history.length > 1) {
                router.back();
            } else {
                navigateTo('/');
            }
        } catch (error) {
            logger.error('Navigate back failed', error);
            navigateTo('/');
        }
    }, [router, navigateTo]);

    const redirectToHome = useCallback(() => {
        navigateTo('/', { replace: true });
    }, [navigateTo]);

    const redirectToLogin = useCallback(() => {
        navigateTo('/login', { replace: true });
    }, [navigateTo]);

    return {
        navigateTo,
        navigateBack,
        redirectToHome,
        redirectToLogin,
        router
    };
};

export default useNavigation; 