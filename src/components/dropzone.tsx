import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const Dropzone = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; path: string }[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const filesWithPaths = acceptedFiles.map((file) => ({
        name: file.name,
        size: file.size,
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

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prevFiles) => prevFiles.filter(file => file.name !== fileName));
  };

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

  useEffect(() => {
    console.log('Files dropped:', uploadedFiles);
  },[uploadedFiles]);

  return (
    <div
      className='flex justify-center items-center min-h-screen p-6'
      {...getRootProps()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
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
      </div>

      <div className='w-full max-w-lg'>
        <div
          className='w-full p-6 transition rounded-2xl border-2 border-dashed hover:border-cyan-500 hover:cursor-pointer'
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-slate-800'>Tarik dan Taruh File Disini</h2>
            <p className='text-sm text-slate-400 mt-2'>atau klik untuk telusuri</p>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className='w-full mt-8'>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index} className='flex justify-between items-center gap-6 py-2 border-b border-slate-200 last:border-0'>
                  <span className='text-sm text-slate-700'>{file.path}</span>
                  <div className='flex items-center'>
                    <span className='text-sm text-slate-400 whitespace-nowrap'>{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => handleRemoveFile(file.name)}
                      className='ml-3 text-sm text-red-500 hover:text-red-700'
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;