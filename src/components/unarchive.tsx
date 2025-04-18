import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import formatFileSize from '../utils/formatFileSize';
import formatMessage from '../utils/formatMessage';
import Brand from './brand';
import Built from './built';
import Popover from './popover';

type UnarchiveProps = {
  toggle: (visible: boolean) => void;
  ios: boolean;
}

const Unarchive: React.FC<UnarchiveProps> = ({ toggle, ios }) => {
  const handleToggle = () => {
    toggle(true);
  };

  const [menuScrolled, setMenuScrolled] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<{ name: string; content: Blob }[]>([]);
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const menuRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleDrop = async (acceptedFiles: File[]) => {
    setIsFadingOut(false);
    setIsDragActive(false);
    setErrorFile(null);
    setExtractedFiles([]);

    try {
      const file = acceptedFiles[0];
      if (!file) {
        setErrorFile('Tidak ada file yang ditemukan.');
        return;
      }

      // console.log('File diterima:', file);

      const buffer = await file.arrayBuffer();
      // console.log('Buffer size:', buffer.byteLength);

      const zip = await JSZip.loadAsync(buffer);
      // console.log('ZIP berhasil dibuka:', zip);

      const files = [];

      for (const [filename, fileData] of Object.entries(zip.files)) {
        if (!fileData.dir) {
          const content = await fileData.async('blob');
          files.push({ name: filename, content, size: content.size });
        }
      }

      setExtractedFiles(files);
      // console.log('File berhasil diekstrak:', files);
    } catch (error) {
      console.error('Error extracting archive:', error);
      setErrorFile('*Gagal ekstrak file*. Pastikan file yang diunggah adalah zip yang valid.');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleDownloadFile = (file: { name: string; content: Blob }) => {
    saveAs(file.content, file.name);
  };

  useEffect(() => {
    const activeElement = menuRefs.current.find(el => el?.classList.contains('active'));

    if (activeElement) {
      activeElement.scrollIntoView({ behavior: "smooth", inline: "center" });
    }

    const body = document.querySelector('body') as HTMLElement;
    const container = document.querySelector('.menu-container') as HTMLDivElement;
    if ((container.clientWidth + 6) > body.clientWidth) {
      setMenuScrolled(true);
    }
  },[]);

  return (
    <div
      className='flex justify-center items-center min-h-screen p-6 main-layout'
      {...getRootProps()}
      onClick={(e) => e.stopPropagation()}
    >
      <section
        className={`
          fixed top-0 left-0 w-full h-full p-8 transition
          ${isDragActive ? 'z-10 bg-slate-950/70 backdrop-blur-lg' : '-z-10 opacity-0'}
        `}
      >
        <div className={`
          flex items-center justify-center w-full h-full
          ${isDragActive ? 'rounded-3xl border-4 border-dashed border-cyan-500' : ''}
        `}>
          <h2 className='text-4xl font-bold text-cyan-500 text-center'>Letakkan File Disini</h2>
        </div>
      </section>

      <section className={`w-full max-w-lg ${extractedFiles.length < 1 ? 'mb-24 md:mb-32' : ''}`}>
        <div className='w-fit mx-auto mb-4'>
          <Popover content='Buat dan ekstrak file ZIP tanpa harus ribet instal aplikasi tambahan'>
            <Brand />
          </Popover>
        </div>

        <div className='mb-8 -mx-6 px-6 overflow-auto scrollbar-none'>
          <div className={`menu-container ${ios ? 'max-md:[&.active_button:last-child]:mr-6' : ''} ${menuScrolled ? 'active' : ''} flex justify-center gap-2 w-max mx-auto`}>
            <button
              type='button'
              ref={el => {
                if (el) menuRefs.current[0] = el;
              }}
              onClick={handleToggle}
              className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white dark:[&.active]:hover:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 dark:[&.active]:bg-cyan-600'
            >
              Buat
            </button>
            <button
              type='button'
              ref={el => {
                if (el) menuRefs.current[1] = el;
              }}
              className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white dark:[&.active]:hover:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 dark:[&.active]:bg-cyan-600 active'
            >
              Ekstrak
            </button>
          </div>
        </div>

        <div
          className='w-full p-6 transition rounded-2xl border-2 border-dashed hover:border-cyan-400 dark:border-slate-700 dark:hover:border-cyan-500 hover:cursor-pointer'
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <div className='text-center py-4'>
            <h2 className='text-xl font-semibold text-slate-800 dark:text-white'>Tarik & Taruh File Disini</h2>
            <p className='text-sm text-slate-400 dark:text-slate-600 mt-2'>atau klik untuk telusuri</p>
          </div>
        </div>

        {extractedFiles.length > 0 &&
          <div className='w-full mt-8'>
            <ul>
              {extractedFiles.map((file, index) => (
                <li key={index} className='flex justify-between items-center gap-6 py-3 break-word border-b border-slate-200 dark:border-slate-700 last:border-0'>
                  <span className='text-sm text-slate-700 dark:text-white'>{file.name}</span>
                  <div className='flex items-center'>
                    <span className='text-sm text-slate-400 dark:text-slate-500 whitespace-nowrap'>{formatFileSize(file.content.size)}</span>
                    <button
                      type='button'
                      onClick={() => handleDownloadFile(file)}
                      className='ml-3 text-sm text-cyan-500 hover:text-cyan-600'
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                        <path d='M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2' />
                        <path d='M7 11l5 5l5 -5' />
                        <path d='M12 4l0 12' />
                      </svg>
                      <span className='sr-only'>Unduh</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }

        {errorFile &&
          <div className={`mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm transition duration-500 ${isFadingOut ? 'opacity-0 -translate-y-4' : 'opacity-100 -translate-y-0'}`}>
            <p dangerouslySetInnerHTML={{ __html: formatMessage(errorFile) }}></p>
          </div>
        }

        <Built />
      </section>
    </div>
  );
};

export default Unarchive;