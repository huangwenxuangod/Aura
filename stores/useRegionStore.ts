import { create } from 'zustand';
import { 
  Region, 
  RegionConfig, 
  detectRegion, 
  getRegionConfig, 
  setRegion as saveRegion,
  REGION_CONFIGS 
} from '@/lib/region';

interface RegionState {
  // State
  region: Region;
  config: RegionConfig;
  isDetecting: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setRegion: (region: Region) => Promise<void>;
  toggleRegion: () => Promise<void>;
}

export const useRegionStore = create<RegionState>((set, get) => ({
  // 默认国际版
  region: 'INTL',
  config: REGION_CONFIGS.INTL,
  isDetecting: false,
  isInitialized: false,

  // 初始化：检测 IP
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isDetecting: true });

    try {
      const region = await detectRegion();
      const config = getRegionConfig(region);
      set({ region, config, isInitialized: true });
    } catch (error) {
      console.error('Failed to detect region:', error);
      set({ isInitialized: true });
    } finally {
      set({ isDetecting: false });
    }
  },

  // 手动设置区域
  setRegion: async (region: Region) => {
    await saveRegion(region);
    const config = getRegionConfig(region);
    set({ region, config });
  },

  // 切换区域
  toggleRegion: async () => {
    const { region } = get();
    const newRegion: Region = region === 'CN' ? 'INTL' : 'CN';
    await get().setRegion(newRegion);
  },
}));
