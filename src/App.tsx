import { useState, useEffect, useMemo, useCallback } from 'react';
import Archive from './components/archive';
import Unarchive from './components/unarchive';

function App() {
  const [isChildren, setIsChildren] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

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
        setIsChildren(true);
        setIsMobile(event.data.isMobile);
      }
    };

    window.addEventListener('message', handleScreenSizeMessage);

    return () => {
      window.removeEventListener('message', handleScreenSizeMessage);
    };
  }, []);

  useEffect(() => {
    const userAgent = window.navigator.userAgent
    const isTouchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 2

    if (
      /iPad|iPhone|iPod/.test(userAgent) ||
      (userAgent.includes('Mac') && isTouchDevice)
    ) {
      setIsIos(true)
    }
  },[]);

  const mainClass = useMemo(() => {
    if (isChildren) {
      return isMobile
        ? 'max-md:[&_.main-layout]:pb-24'
        : 'md:[&_.main-layout]:pt-24';
    }
    return '';
  }, [isChildren, isMobile]);

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

  const [showArchive, setShowArchive] = useState(true);

  return (
    <main className={mainClass}>
      {!isChildren &&
        <h1 className='sr-only'>KieZip by Degiam</h1>
      }
      {showArchive &&
        <Archive toggle={setShowArchive} ios={isIos} />
      }
      {!showArchive &&
        <Unarchive toggle={setShowArchive} ios={isIos} />
      }
    </main>
  )
}

export default App;