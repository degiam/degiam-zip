import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import formatFileSize from '../utils/formatFileSize';
import formatMessage from '../utils/formatMessage';
import Brand from './brand';
import Built from './built';
import Popover from './popover';

type ArchiveProps = {
  toggle: (visible: boolean) => void;
  ios: boolean;
}

const Archive: React.FC<ArchiveProps> = ({ toggle, ios }) => {
  const handleToggle = () => {
    toggle(false);
  };

  const [menuScrolled, setMenuScrolled] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; path: string }[]>([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [zipName, setZipName] = useState('');
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);
  const [errorUpload, setErrorUpload] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const menuRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const filenameRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
    setIsFadingOut(false);
    const existingPaths = new Set(uploadedFiles.map(({ path }) => path));

    const filesWithPaths = acceptedFiles.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));

    const newFiles = filesWithPaths.filter(({ path }) => !existingPaths.has(path));

    if (newFiles.length === 0) {
      setErrorUpload('File yang diunggah sudah ada, tidak ada yang ditambahkan.');
      setIsDragActive(false);
      return;
    }

    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setIsDragActive(false);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const handleRemoveFile = (targetFile: File) => {
    setUploadedFiles((prevFiles) => prevFiles.filter(({ file }) => file !== targetFile));
  };

  const determineZipName = () => {
    const folderPaths = new Set(uploadedFiles.map(({ path }) => path.split('/')[0]));

    if (uploadedFiles.length === 1) {
      const singleFile = uploadedFiles[0].path;
      const fileNameWithoutExt = singleFile.split('/').pop()?.split('.').slice(0, -1).join('.');
      return fileNameWithoutExt || 'file';
    }

    if (folderPaths.size === 1) {
      return Array.from(folderPaths)[0];
    } else if (folderPaths.size > 1) {
      return 'kiezip';
    }

    const hasFilesWithoutFolders = uploadedFiles.some(({ path }) => !path.includes('/'));
    if (hasFilesWithoutFolders) {
      return 'kiezip';
    }

    return 'kiezip';
  };

  const handleDownloadZip = async () => {
    setErrorFile(null);
    setErrorName(null);
    setIsLoading(true);

    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(zipName)) {
      setErrorName('Nama file tidak valid. Hindari karakter seperti < > : " / \\ | ? *');
      return;
    }

    if (!zipName.trim()) {
      setErrorName('Nama file harus diisi');
      return;
    }

    try {
      const zip = new JSZip();

      uploadedFiles.forEach(({ file, path }) => {
        zip.file(path, file);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${zipName || 'kiezip'}.zip`);
    } catch (error) {
      setErrorFile('Terjadi kesalahan saat membuat ZIP. Silakan periksa lagi file atau folder yang dipilih.');
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsPopupVisible(false);
    }
  };

  const openPopup = () => {
    const suggestedName = determineZipName();
    setZipName(suggestedName);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setErrorName(null);
  };

  useEffect(() => {
    if (isPopupVisible && filenameRef.current) {
      filenameRef.current.focus();
      filenameRef.current.setSelectionRange(0, filenameRef.current.value.length);
    }
  }, [isPopupVisible]);

  useEffect(() => {
    if (errorUpload) {
      const fadeOutTimeout = setTimeout(() => setIsFadingOut(true), 9500);
      const clearErrorTimeout = setTimeout(() => {
        setErrorUpload(null);
        setIsFadingOut(false);
      }, 10000);
  
      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearErrorTimeout);
      };
    }
  }, [errorUpload]);

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

      <section className={`w-full max-w-lg ${uploadedFiles.length < 1 ? 'mb-24 md:mb-32' : ''}`}>
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
              className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white dark:[&.active]:hover:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 dark:[&.active]:bg-cyan-600 active'
            >
              Buat
            </button>
            <button
              type='button'
              ref={el => {
                if (el) menuRefs.current[1] = el;
              }}
              onClick={handleToggle}
              className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white dark:[&.active]:hover:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 dark:[&.active]:bg-cyan-600'
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

        {errorUpload &&
          <div className={`mt-8 -mb-3 p-4 bg-red-100 text-red-700 rounded-lg text-sm transition duration-500 ${isFadingOut ? 'opacity-0 -translate-y-4' : 'opacity-100 -translate-y-0'}`}>
            <p dangerouslySetInnerHTML={{ __html: formatMessage(errorUpload) }}></p>
          </div>
        }

        {uploadedFiles.length > 0 &&
          <div className='w-full mt-8'>
            <ul>
              {uploadedFiles.map(({ file, path }, index) => (
                <li key={index} className='flex justify-between items-center gap-6 py-3 break-word border-b border-slate-200 dark:border-slate-700 last:border-0'>
                  <span className='text-sm text-slate-700 dark:text-white'>{path}</span>
                  <div className='flex items-center'>
                    <span className='text-sm text-slate-400 dark:text-slate-500 whitespace-nowrap'>{formatFileSize(file.size)}</span>
                    <button
                      type='button'
                      onClick={() => handleRemoveFile(file)}
                      className='ml-3 text-sm text-red-500 hover:text-red-700'
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path stroke='none' d='M0 0h24v24H0z' fill='none'/>
                        <path d='M4 7l16 0' />
                        <path d='M10 11l0 6' />
                        <path d='M14 11l0 6' />
                        <path d='M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12' />
                        <path d='M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3' />
                      </svg>
                      <span className='sr-only'>Hapus</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type='button'
              onClick={openPopup}
              className='mt-8 w-full px-4 py-3 rounded-lg transition font-bold text-white border border-cyan-500 hover:border-cyan-600 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500'
            >
              Buat ZIP
            </button>
          </div>
        }

        {isPopupVisible &&
          <div className='fixed inset-0 flex justify-center items-center bg-black/80 z-50 p-3'>
            <div className='flex flex-col gap-4 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-md'>
              <h3 className='text-lg font-bold'>Masukkan Nama File ZIP</h3>
              <fieldset className='flex flex-col gap-2 mb-2'>
                <label className='sr-only' htmlFor='zip_name'>Nama</label>
                <input
                  ref={filenameRef}
                  id='zip_name'
                  type='text'
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  className={`input ${errorName ? 'border-red-500' : ''}`}
                />
                {errorName && 
                  <p className='text-xs text-red-500'>{errorName}</p>
                }
              </fieldset>
              <button
                type='button'
                onClick={handleDownloadZip}
                className={`w-full px-4 py-3 rounded-lg transition font-bold relative flex items-center justify-center gap-2 text-white border border-cyan-500 hover:border-cyan-600 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 ${isLoading ? 'pointer-events-none' : ''}`}
              >
                <span>Unduh ZIP</span>
                {/* {isLoading &&
                  <div className='w-8 h-8 invert brightness-0 contrast-100 -my-4'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-full h-full animate-spin text-cyan-600'>
                      <path fill='none' d='M0 0h24v24H0z' stroke='none' />
                      <path opacity='.25' d='M5.636 5.636a9 9 0 1 0 12.728 12.728a9 9 0 0 0 -12.728 -12.728z' />
                      <path d='M16.243 7.757a6 6 0 0 0 -8.486 0' />
                    </svg>
                  </div>
                } */}
              </button>
              <button
                type='button'
                onClick={closePopup}
                className={`w-full px-4 py-3 rounded-lg transition text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 ${isLoading ? 'pointer-events-none' : ''}`}
              >
                Batal
              </button>
            </div>
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

export default Archive;