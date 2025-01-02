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
    return () => window.removeEventListener('message', () => {});
  }, []);

  return (
    <main>
      <Dropzone />
    </main>
  )
}

export default App;