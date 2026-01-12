import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Prediction, PredictionWithRelations } from '@/types';

interface PredictionState {
  // State
  currentPrediction: PredictionWithRelations | null;
  isLoading: boolean;

  // Actions
  fetchCurrentPrediction: () => Promise<void>;
  setCurrentPrediction: (prediction: PredictionWithRelations | null) => void;
  clearPrediction: () => void;
}

export const usePredictionStore = create<PredictionState>((set) => ({
  currentPrediction: null,
  isLoading: false,

  fetchCurrentPrediction: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ currentPrediction: null });
        return;
      }

      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          referees (*),
          check_ins (*)
        `)
        .eq('user_id', user.id)
        .in('status', ['ACTIVE', 'JUDGING'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          set({ currentPrediction: null });
          return;
        }
        console.error('Failed to fetch prediction:', error);
        return;
      }

      set({ currentPrediction: data });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentPrediction: (prediction) => set({ currentPrediction: prediction }),

  clearPrediction: () => set({ currentPrediction: null }),
}));

