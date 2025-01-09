const formatFileSize = (size: number): string => {
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

export default formatFileSize;
