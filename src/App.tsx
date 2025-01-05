import { useState, useEffect, useMemo, useCallback } from 'react';
import Dropzone from './components/zip';

function App() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateTheme = useCallback((isDarkMode: boolean) => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleThemeChange = (event: MessageEvent) => {
      if (event.data?.type === 'theme-change') {
        updateTheme(event.data.isDarkMode);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      updateTheme(event.matches);
    };

    updateTheme(mediaQuery.matches);

    window.addEventListener('message', handleThemeChange);
    mediaQuery.addEventListener('change', handleMediaChange);

    window.parent.postMessage({ type: 'iframe-ready' }, '*');

    return () => {
      window.removeEventListener('message', handleThemeChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [updateTheme]);

  useEffect(() => {
    const handleScreenSizeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'screen-size') {
        setIsStandalone(true);
        setIsMobile(event.data.isMobile);
      }
    };

    window.addEventListener('message', handleScreenSizeMessage);

    return () => {
      window.removeEventListener('message', handleScreenSizeMessage);
    };
  }, []);

  const mainClass = useMemo(() => {
    if (isStandalone) {
      return isMobile
        ? '[&_.main-layout]:max-md:pb-24'
        : '[&_.main-layout]:md:pt-24';
    }
    return '';
  }, [isStandalone, isMobile]);

  // useEffect(() => {
  //   const sendHeightToParent = () => {
  //     const height = document.body.scrollHeight;
  //     window.parent.postMessage({ type: 'resize', height }, '*');
  //   };

  //   sendHeightToParent();

  //   const observer = new MutationObserver(sendHeightToParent);
  //   observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  //   return () => {
  //     observer.disconnect();
  //   };
  // }, []);

  return (
    <main className={mainClass}>
      <h1 className='sr-only'>KieZip by Degiam</h1>
      <Dropzone />
    </main>
  )
}

export default App;