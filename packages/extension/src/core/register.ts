export interface PlatformModuleConfig {
  id: string;
  name: string;
  onInitializeBackground?: () => void;
  onInitializeContent?: (settings: any) => void;
}

export class PlatformRegistrar {
  private platforms: Map<string, PlatformModuleConfig> = new Map();

  register(config: PlatformModuleConfig) {
    if (this.platforms.has(config.id)) {
      console.warn(`Platform module ${config.id} is already registered.`);
      return;
    }
    this.platforms.set(config.id, config);
    console.log(`🔌 Platform Registrar: Successfully registered [${config.name}]`);
  }

  initializeBackgroundAll() {
    console.log("⚙️ Platform Registrar: Invoking background scripts for all registered modules...");
    this.platforms.forEach((platform) => {
      if (platform.onInitializeBackground) {
        try {
          platform.onInitializeBackground();
        } catch (err) {
          console.error(`Failed to initialize background for platform ${platform.id}:`, err);
        }
      }
    });
  }

  initializeContentAll(settings: any) {
    console.log("⚙️ Platform Registrar: Invoking content scripts for all registered modules...");
    this.platforms.forEach((platform) => {
      if (platform.onInitializeContent) {
        try {
          platform.onInitializeContent(settings);
        } catch (err) {
          console.error(`Failed to initialize content for platform ${platform.id}:`, err);
        }
      }
    });
  }

  getPlatform(id: string): PlatformModuleConfig | undefined {
    return this.platforms.get(id);
  }

  getAllPlatforms(): PlatformModuleConfig[] {
    return Array.from(this.platforms.values());
  }
}

export const platformRegistrar = new PlatformRegistrar();

export const registerPlatform = (config: PlatformModuleConfig) => {
  platformRegistrar.register(config);
};
