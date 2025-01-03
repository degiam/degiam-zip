import { useEffect, useState } from 'react';
import Dropzone from './components/dropzone';

function App() {
  useEffect(() => {
    const sendHeightToParent = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    sendHeightToParent();

    const observer = new MutationObserver(sendHeightToParent);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'theme-change') {
        if (event.data.isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    const updateTheme = (isDarkMode: boolean) => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateTheme(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateTheme(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('message', () => {});
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'screen-size') {
        setIsStandalone(true);
        if (event.data.isMobile) {
          setIsMobile(true);
        } else {
          setIsMobile(false);
        }
      }
    };
  
    window.addEventListener('message', handleMessage);
  
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <main className={isStandalone ? isMobile ? '[&_.main-layout]:max-md:pb-24' : '[&_.main-layout]:md:pt-24' : ''}>
      <h1 className='sr-only'>QuiZip by Degiam</h1>
      <Dropzone />
    </main>
  )
}

export default App;