import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Brand from './brand';

const Dropzone = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; path: string }[]>([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [zipName, setZipName] = useState('');
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);

  const filenameRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (size: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    let formattedSize = size;

    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }

    if (formattedSize % 1 === 0) {
      return `${formattedSize} ${units[unitIndex]}`;
    }

    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
  };

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
          <h2 className='text-4xl font-bold text-cyan-500'>Drop files here</h2>
        </div>
      </section>

      <section className={`w-full max-w-lg ${uploadedFiles.length < 1 ? 'mb-32' : ''}`}>
        <div className='w-fit mx-auto mb-4'>
          <Brand />
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
              onClick={openPopup}
              className='mt-8 w-full px-4 py-3 rounded-lg transition font-bold text-white bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500'
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
                <input
                  ref={filenameRef}
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
                className='w-full px-4 py-3 rounded-lg transition font-bold text-white bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500'
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

        <div className='text-slate-400/60 dark:text-slate-600 text-xs flex items-center justify-center gap-1 mt-14'>
          <span>Built on</span>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16' fill='#61dafb'>
            <path d='M16.546,2.055l-0.005,-0.005c-1.252,0 -2.892,0.893 -4.55,2.441c-1.658,-1.539 -3.298,-2.423 -4.55,-2.423l-0,0.005c-0.383,-0 -0.729,0.082 -1.03,0.255c-1.28,0.738 -1.567,3.038 -0.906,5.926c-2.833,0.874 -4.678,2.273 -4.678,3.748c0,1.481 1.854,2.883 4.696,3.753c-0.656,2.897 -0.364,5.202 0.92,5.94c0.296,0.173 0.642,0.255 1.025,0.255c1.253,-0 2.892,-0.893 4.55,-2.441c1.658,1.539 3.298,2.423 4.55,2.423c0.383,-0 0.729,-0.082 1.03,-0.255c1.28,-0.738 1.567,-3.038 0.906,-5.926c2.824,-0.87 4.669,-2.273 4.669,-3.749c-0,-1.48 -1.854,-2.883 -4.696,-3.753c0.656,-2.897 0.364,-5.201 -0.92,-5.939c-0.294,-0.172 -0.637,-0.254 -1.011,-0.255Zm-9.602,18.761c-0.619,-0.355 -0.888,-1.708 -0.679,-3.448c0.051,-0.428 0.133,-0.879 0.233,-1.339c0.893,0.218 1.867,0.387 2.892,0.496c0.615,0.843 1.253,1.608 1.895,2.278c-1.485,1.38 -2.879,2.136 -3.826,2.136c-0.205,-0.005 -0.378,-0.046 -0.515,-0.123Zm10.804,-3.471c0.214,1.74 -0.05,3.093 -0.665,3.453c-0.136,0.082 -0.314,0.118 -0.524,0.118c-0.942,0 -2.341,-0.751 -3.826,-2.122c0.638,-0.67 1.276,-1.431 1.881,-2.273c1.03,-0.11 2.005,-0.278 2.897,-0.501c0.105,0.46 0.187,0.901 0.237,1.325Zm-5.739,0.738c-0.423,-0.437 -0.847,-0.925 -1.266,-1.458c0.41,0.019 0.829,0.032 1.252,0.032c0.429,0 0.852,-0.009 1.267,-0.032c-0.41,0.533 -0.834,1.021 -1.253,1.458Zm3.147,-4.268c-0.355,0.615 -0.719,1.198 -1.097,1.74c-0.679,0.059 -1.367,0.091 -2.059,0.091c-0.688,0 -1.376,-0.032 -2.05,-0.086c-0.378,-0.542 -0.747,-1.121 -1.102,-1.731c-0.346,-0.597 -0.66,-1.203 -0.947,-1.813c0.282,-0.61 0.601,-1.221 0.943,-1.817c0.355,-0.615 0.719,-1.198 1.097,-1.74c0.679,-0.06 1.367,-0.091 2.059,-0.091c0.688,-0 1.376,0.031 2.05,0.086c0.378,0.542 0.747,1.121 1.102,1.731c0.346,0.597 0.66,1.202 0.947,1.813c-0.287,0.61 -0.601,1.22 -0.943,1.817Zm1.472,-0.592c0.246,0.61 0.455,1.221 0.628,1.813c-0.596,0.146 -1.225,0.269 -1.876,0.364c0.223,-0.351 0.446,-0.71 0.656,-1.079c0.209,-0.365 0.405,-0.734 0.592,-1.098Zm-8.008,2.177c-0.646,-0.095 -1.27,-0.214 -1.867,-0.36c0.168,-0.587 0.378,-1.193 0.615,-1.799c0.186,0.365 0.382,0.729 0.596,1.093c0.215,0.365 0.433,0.72 0.656,1.066Zm-4.126,-1.093c-1.613,-0.688 -2.656,-1.59 -2.656,-2.305c0,-0.715 1.043,-1.621 2.656,-2.304c0.391,-0.169 0.82,-0.319 1.261,-0.46c0.26,0.892 0.602,1.821 1.025,2.773c-0.419,0.948 -0.756,1.872 -1.011,2.761c-0.451,-0.142 -0.879,-0.296 -1.275,-0.465Zm15.008,0c-0.392,0.169 -0.82,0.319 -1.262,0.46c-0.26,-0.893 -0.601,-1.822 -1.025,-2.774c0.419,-0.947 0.756,-1.872 1.011,-2.76c0.451,0.141 0.88,0.296 1.28,0.465c1.613,0.687 2.656,1.589 2.656,2.304c-0.005,0.715 -1.048,1.622 -2.66,2.305Zm-7.507,-4.386c1.149,-0 2.082,0.932 2.082,2.081c-0,1.149 -0.933,2.082 -2.082,2.082c-1.148,-0 -2.081,-0.933 -2.081,-2.082c-0,-1.149 0.933,-2.081 2.081,-2.081Zm-3.379,-1.317c-0.223,0.351 -0.447,0.711 -0.656,1.08c-0.21,0.364 -0.406,0.729 -0.592,1.093c-0.246,-0.61 -0.456,-1.221 -0.629,-1.813c0.597,-0.141 1.225,-0.264 1.877,-0.36Zm8.627,0.36c-0.169,0.588 -0.378,1.194 -0.615,1.799c-0.187,-0.364 -0.383,-0.728 -0.597,-1.093c-0.21,-0.364 -0.433,-0.719 -0.656,-1.066c0.647,0.096 1.271,0.214 1.868,0.36Zm-10.991,-2.309c-0.214,-1.74 0.05,-3.093 0.665,-3.453c0.136,-0.082 0.314,-0.118 0.524,-0.118c0.942,-0 2.341,0.751 3.826,2.122c-0.638,0.67 -1.276,1.431 -1.881,2.273c-1.03,0.11 -2.005,0.278 -2.897,0.501c-0.105,-0.46 -0.187,-0.901 -0.237,-1.325Zm10.804,-3.471c0.619,0.355 0.888,1.708 0.679,3.448c-0.051,0.428 -0.133,0.879 -0.233,1.339c-0.893,-0.218 -1.867,-0.387 -2.892,-0.496c-0.615,-0.843 -1.253,-1.608 -1.895,-2.278c1.485,-1.38 2.879,-2.136 3.826,-2.136c0.205,0.005 0.378,0.046 0.515,0.123Zm-5.07,2.738c0.424,0.437 0.848,0.924 1.267,1.457c-0.41,-0.018 -0.829,-0.032 -1.253,-0.032c-0.428,0 -1.266,0.032 -1.266,0.032c-0,0 0.833,-1.02 1.252,-1.457Z' />
          </svg>
          <span>React</span>
        </div>
      </section>
    </div>
  );
};

export default Dropzone;