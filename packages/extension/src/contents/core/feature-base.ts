/**
 * Base class cho mọi tính năng trong extension
 */
export default class FeatureBase {
  name: string;
  config: any;
  isEnabled: boolean;

  constructor(name: string, config: any = {}) {
    this.name = name;
    this.config = config;
    this.isEnabled = false;
  }

  /**
   * Khởi tạo tính năng (chạy khi trang web load)
   */
  async init() {
    console.log(`[Feature: ${this.name}] Initializing...`);
    this.isEnabled = await this.checkEnabled();
    
    if (this.isEnabled) {
      this.run();
    }
  }

  /**
   * Kiểm tra xem tính năng có được bật trong cài đặt không
   */
  async checkEnabled() {
    const settings = await chrome.storage.local.get(this.name);
    return settings[this.name] !== false; // Mặc định là true
  }

  /**
   * Logic thực thi của tính năng (phải được ghi đè ở class con)
   */
  run() {
    console.warn(`[Feature: ${this.name}] run() method not implemented.`);
  }
}
