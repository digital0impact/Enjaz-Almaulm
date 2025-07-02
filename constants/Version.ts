
export const VERSION_INFO = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 1,
  releaseDate: '2025-01-13',
  
  // تنسيق رقم الإصدار
  getVersion(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  },
  
  // تنسيق رقم الإصدار مع البناء
  getFullVersion(): string {
    return `${this.getVersion()}.${this.build}`;
  },
  
  // معلومات مفصلة عن الإصدار
  getVersionInfo(): {
    version: string;
    fullVersion: string;
    releaseDate: string;
    buildNumber: number;
  } {
    return {
      version: this.getVersion(),
      fullVersion: this.getFullVersion(),
      releaseDate: this.releaseDate,
      buildNumber: this.build
    };
  },
  
  // زيادة رقم الإصدار
  incrementPatch(): void {
    this.patch += 1;
    this.build += 1;
  },
  
  incrementMinor(): void {
    this.minor += 1;
    this.patch = 0;
    this.build += 1;
  },
  
  incrementMajor(): void {
    this.major += 1;
    this.minor = 0;
    this.patch = 0;
    this.build += 1;
  }
};
