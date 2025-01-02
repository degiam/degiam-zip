import { useEffect } from 'react';
import Dropzone from './components/dropzone';

function App() {
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

  return (
    <main>
      <Dropzone />
    </main>
  )
}

export default App;