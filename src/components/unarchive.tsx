import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import formatFileSize from '../utils/formatFileSize';
import Brand from './brand';
import Built from './built';

type UnarchiveProps = {
  toggle: (visible: boolean) => void;
}

const Unarchive: React.FC<UnarchiveProps> = ({ toggle }) => {
  const handleToggle = () => {
    toggle(true);
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState<{ name: string; content: Blob }[]>([]);
  const [errorFile, setErrorFile] = useState<string | null>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
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
      setErrorFile('Gagal mengekstrak file. Pastikan file yang diunggah adalah arsip yang valid.');
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
          <h2 className='text-4xl font-bold text-cyan-500'>Drop files here</h2>
        </div>
      </section>

      <section className={`w-full max-w-lg ${extractedFiles.length < 1 ? 'mb-24 md:mb-32' : ''}`}>
        <div className='w-fit mx-auto mb-4'>
          <Brand />
        </div>

        <div className='flex justify-center gap-2 mb-8'>
          <button
            type='button'
            onClick={handleToggle}
            className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 [&.active]:dark:bg-cyan-600'
          >
            Buat
          </button>
          <button
            type='button'
            className='min-w-24 px-3.5 py-2.5 rounded-lg transition border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&.active]:pointer-events-none [&.active]:text-white [&.active]:border-cyan-500 [&.active]:bg-cyan-500 [&.active]:dark:bg-cyan-600 active'
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

        {extractedFiles.length > 0 && (
          <div className='w-full mt-8'>
            <ul>
              {extractedFiles.map((file, index) => (
                <li key={index} className='flex justify-between items-center gap-6 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0'>
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

export default Unarchive;