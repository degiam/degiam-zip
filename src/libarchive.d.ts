declare module 'libarchive.js' {
  export class Archive {
    static init(options: { workerUrl: string }): Promise<void>;
    static open(buffer: ArrayBuffer): Promise<Archive>;

    extractFiles(): Promise<File[]>;
    getFilesArray(): Promise<{ name: string; fileData: Uint8Array }[]>;
  }

  export interface ArchiveEntry {
    name: string;
    fileData: Uint8Array;
  }
}
