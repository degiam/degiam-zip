import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import formatFileSize from '../utils/formatFileSize';
import Brand from './brand';
import Built from './built';

type ArchiveProps = {
  toggle: (visible: boolean) => void;
}

const Archive: React.FC<ArchiveProps> = ({ toggle }) => {
  const handleToggle = () => {
    toggle(false);
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; path: string }[]>([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [zipName, setZipName] = useState('');
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);

  const filenameRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const filesWithPaths = acceptedFiles.map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      }));
      setUploadedFiles((prevFiles) => [...prevFiles, ...filesWithPaths]);
      setIsDragActive(false);
    },
    onDragEnter: () => {
      setIsDragActive(true);
    },
    onDragLeave: () => {
      setIsDragActive(false);
    },
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
      return 'multiple-folders';
    }

    const hasFilesWithoutFolders = uploadedFiles.some(({ path }) => !path.includes('/'));
    if (hasFilesWithoutFolders) {
      return 'mixed-files';
    }

    return 'files';
  };

  const handleDownloadZip = async () => {
    setErrorFile(null);
    setErrorName(null);

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
      saveAs(blob, `${zipName || 'archive'}.zip`);
    } catch (error) {
      setErrorFile('Terjadi kesalahan saat membuat ZIP. Silakan periksa lagi file atau folder yang dipilih.');
      console.error(error);
    }

    setIsPopupVisible(false);
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
          <h2 className='text-4xl font-bold text-cyan-500'>Letakkan File Disini</h2>
        </div>
      </section>

      <section className={`w-full max-w-lg ${uploadedFiles.length < 1 ? 'mb-24 md:mb-32' : ''}`}>
        <div className='w-fit mx-auto mb-4'>
          <Brand />
        </div>

        <div className='flex justify-center gap-2 mb-8'>
          <button
            type='button'
            className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 [&.active]:dark:bg-cyan-600 active'
          >
            Buat
          </button>
          <button
            type='button'
            onClick={handleToggle}
            className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 [&.active]:dark:bg-cyan-600'
          >
            Ekstrak
          </button>
        </div>

        <div
          className='w-full p-6 transition rounded-2xl border-2 border-dashed hover:border-cyan-400 dark:border-slate-700 dark:hover:border-cyan-500 hover:cursor-pointer'
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <div className='text-center py-4'>
            <h2 className='text-xl font-semibold text-slate-800 dark:text-white'>Tarik dan Taruh File Disini</h2>
            <p className='text-sm text-slate-400 dark:text-slate-600 mt-2'>atau klik untuk telusuri</p>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className='w-full mt-8'>
            <ul>
              {uploadedFiles.map(({ file, path }, index) => (
                <li key={index} className='flex justify-between items-center gap-6 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0'>
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
        )}

        {isPopupVisible && (
          <div className='fixed inset-0 flex justify-center items-center bg-black/80 z-50'>
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
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:shadow-[2px_2px_0_#22d3ee,-2px_2px_0_#22d3ee,2px_-2px_0_#22d3ee,-2px_-2px_0_#22d3ee] focus-visible:outline-none focus:border-slate-400 ${errorName ? 'border-red-500' : ''}`}
                />
                {errorName && 
                  <p className='text-xs text-red-500'>{errorName}</p>
                }
              </fieldset>
              <button
                type='button'
                onClick={handleDownloadZip}
                className='w-full px-4 py-3 rounded-lg transition font-bold text-white border border-cyan-500 hover:border-cyan-600 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500'
              >
                Unduh ZIP
              </button>
              <button
                type='button'
                onClick={closePopup}
                className='w-full px-4 py-3 rounded-lg transition text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {errorFile && (
          <div className='mt-4 p-4 bg-red-100 text-red-700 rounded-lg'>
            <p>{errorFile}</p>
          </div>
        )}

        <Built />
      </section>
    </div>
  );
};

export default Archive;