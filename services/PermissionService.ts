import { InAppPurchaseService } from './InAppPurchaseService';



export class PermissionService {
  private static instance: PermissionService;
  private userId: string | null = null;
  private subscriptionType: string = 'مجاني';

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    const purchaseService = InAppPurchaseService.getInstance();
    const subscription = await purchaseService.getCurrentSubscription(userId);
    this.subscriptionType = subscription.type;
  }

  public async canDownload(): Promise<boolean> {
    return this.subscriptionType !== 'مجاني';
  }

  public async canExport(): Promise<boolean> {
    return this.subscriptionType !== 'مجاني';
  }

  public async canBackup(): Promise<boolean> {
    return this.subscriptionType !== 'مجاني';
  }

  public async getMaxBackups(): Promise<number> {
    switch (this.subscriptionType) {
      case 'سنوي':
        return -1; // غير محدود
      case 'نصف سنوي':
        return 5;
      default:
        return 0;
    }
  }



  public async canShareFiles(): Promise<boolean> {
    return this.subscriptionType !== 'مجاني';
  }

  public async getMaxStudents(): Promise<number> {
    switch (this.subscriptionType) {
      case 'سنوي':
        return -1; // غير محدود
      case 'نصف سنوي':
        return 100;
      default:
        return 20;
    }
  }

  public async getMaxReports(): Promise<number> {
    switch (this.subscriptionType) {
      case 'سنوي':
        return -1; // غير محدود
      case 'نصف سنوي':
        return 50;
      default:
        return 10;
    }
  }

  public async canAccessAdvancedFeatures(): Promise<boolean> {
    return this.subscriptionType === 'سنوي';
  }

  public async getStorageLimit(): Promise<number> {
    switch (this.subscriptionType) {
      case 'سنوي':
        return 10 * 1024 * 1024 * 1024; // 10GB
      case 'نصف سنوي':
        return 5 * 1024 * 1024 * 1024; // 5GB
      default:
        return 100 * 1024 * 1024; // 100MB
    }
  }

  async checkPermission(action: 'download' | 'export' | 'backup'): Promise<boolean> {
    if (!this.userId) {
      return false;
    }

    switch (action) {
      case 'download':
        return this.canDownload();
      case 'export':
        return this.canExport();
      case 'backup':
        return this.canBackup();
      default:
        return false;
    }
  }

  async showUpgradeDialog(action: string): Promise<void> {
    // يمكن تخصيص هذه الدالة لعرض رسالة مخصصة حسب نوع العملية
    throw new Error(`يجب ترقية اشتراكك للوصول إلى ميزة ${action}`);
  }
} 