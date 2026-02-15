
export const VERSION_INFO = {
  major: 1,
  minor: 4,
  patch: 1,
  build: 10,
  releaseDate: '2025-02-14',
  
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

  // الحصول على نوع الإصدار (تطوير، تجريبي، نهائي)
  getVersionType(): string {
    if (this.build < 10) return 'تطوير';
    if (this.build < 50) return 'تجريبي';
    return 'نهائي';
  },

  // الحصول على عمر الإصدار بالأيام
  getVersionAge(): number {
    const releaseDate = new Date(this.releaseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - releaseDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // التحقق من وجود تحديث جديد
  hasUpdate(currentVersion: string): boolean {
    const current = currentVersion.split('.').map(Number);
    const latest = [this.major, this.minor, this.patch, this.build];
    
    for (let i = 0; i < Math.min(current.length, latest.length); i++) {
      if (latest[i] > current[i]) return true;
      if (latest[i] < current[i]) return false;
    }
    return false;
  },

  // الحصول على ملخص الإصدار
  getVersionSummary(): {
    version: string;
    buildNumber: number;
    type: string;
    age: number;
    isLatest: boolean;
  } {
    return {
      version: this.getVersion(),
      buildNumber: this.build,
      type: this.getVersionType(),
      age: this.getVersionAge(),
      isLatest: true
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
  },

  // تحديث تاريخ الإصدار
  updateReleaseDate(): void {
    this.releaseDate = new Date().toISOString().split('T')[0];
  }
};
