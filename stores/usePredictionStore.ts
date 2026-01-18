import { create } from 'zustand';
import type { 
  PredictionDetail, 
  CheckinPoint, 
  Checkin,
  CheckinProgress,
} from '@/types';
import { 
  getCurrentPrediction, 
  calculateCheckinProgress,
  getTodayCheckinPoint,
} from '@/services/prediction.service';

interface PredictionState {
  // State
  currentPrediction: PredictionDetail | null;
  checkinProgress: CheckinProgress | null;
  todayCheckinPoint: CheckinPoint | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchCurrentPrediction: () => Promise<void>;
  setCurrentPrediction: (prediction: PredictionDetail | null) => void;
  addCheckin: (checkin: Checkin) => void;
  updateCheckinPoint: (pointId: string, status: 'completed' | 'missed') => void;
  reset: () => void;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  // Initial State
  currentPrediction: null,
  checkinProgress: null,
  todayCheckinPoint: null,
  isLoading: false,
  isInitialized: false,

  // Initialize
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isLoading: true });
    try {
      await get().fetchCurrentPrediction();
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取当前预测
  fetchCurrentPrediction: async () => {
    const prediction = await getCurrentPrediction();
    
    if (prediction) {
      const points = prediction.checkin_points || [];
      const progress = calculateCheckinProgress(points);
      const todayPoint = getTodayCheckinPoint(points);
      
      set({ 
        currentPrediction: prediction,
        checkinProgress: progress,
        todayCheckinPoint: todayPoint,
      });
    } else {
      set({ 
        currentPrediction: null,
        checkinProgress: null,
        todayCheckinPoint: null,
      });
    }
  },

  // 设置当前预测
  setCurrentPrediction: (prediction) => {
    if (prediction) {
      const points = prediction.checkin_points || [];
      const progress = calculateCheckinProgress(points);
      const todayPoint = getTodayCheckinPoint(points);
      
      set({ 
        currentPrediction: prediction,
        checkinProgress: progress,
        todayCheckinPoint: todayPoint,
      });
    } else {
      set({ 
        currentPrediction: null,
        checkinProgress: null,
        todayCheckinPoint: null,
      });
    }
  },

  // 添加打卡记录
  addCheckin: (checkin) => {
    const { currentPrediction } = get();
    if (!currentPrediction) return;

    const updatedPrediction = {
      ...currentPrediction,
      checkins: [checkin, ...(currentPrediction.checkins || [])],
    };

    // 如果打卡完成了某个打卡点，更新打卡点状态
    if (checkin.checkin_point_id) {
      updatedPrediction.checkin_points = (currentPrediction.checkin_points || []).map(point =>
        point.id === checkin.checkin_point_id
          ? { ...point, status: 'completed' as const, completed_at: new Date().toISOString() }
          : point
      );
    }

    const points = updatedPrediction.checkin_points || [];
    const progress = calculateCheckinProgress(points);
    const todayPoint = getTodayCheckinPoint(points);

    set({ 
      currentPrediction: updatedPrediction,
      checkinProgress: progress,
      todayCheckinPoint: todayPoint,
    });
  },

  // 更新打卡点状态
  updateCheckinPoint: (pointId, status) => {
    const { currentPrediction } = get();
    if (!currentPrediction) return;

    const updatedPrediction = {
      ...currentPrediction,
      checkin_points: (currentPrediction.checkin_points || []).map(point =>
        point.id === pointId
          ? { 
              ...point, 
              status, 
              completed_at: status === 'completed' ? new Date().toISOString() : null 
            }
          : point
      ),
    };

    const points = updatedPrediction.checkin_points || [];
    const progress = calculateCheckinProgress(points);
    const todayPoint = getTodayCheckinPoint(points);

    set({ 
      currentPrediction: updatedPrediction,
      checkinProgress: progress,
      todayCheckinPoint: todayPoint,
    });
  },

  // 重置状态
  reset: () => set({
    currentPrediction: null,
    checkinProgress: null,
    todayCheckinPoint: null,
    isLoading: false,
    isInitialized: false,
  }),
}));
