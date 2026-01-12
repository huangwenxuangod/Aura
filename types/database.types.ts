// 此文件由 Supabase CLI 生成
// 运行: pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          name: string | null;
          avatar_url: string | null;
          credit_balance: number;
          status: 'IDLE' | 'RECOVERY';
          region: 'global' | 'cn';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          credit_balance?: number;
          status?: 'IDLE' | 'RECOVERY';
          region?: 'global' | 'cn';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          credit_balance?: number;
          status?: 'IDLE' | 'RECOVERY';
          region?: 'global' | 'cn';
          created_at?: string;
          updated_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          recovery_id: string | null;
          title: string;
          description: string | null;
          deadline: string;
          stake: number;
          status: 'ACTIVE' | 'JUDGING' | 'SUCCESS' | 'FAILED';
          referee_code: string;
          created_at: string;
          judging_at: string | null;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          recovery_id?: string | null;
          title: string;
          description?: string | null;
          deadline: string;
          stake: number;
          status?: 'ACTIVE' | 'JUDGING' | 'SUCCESS' | 'FAILED';
          referee_code: string;
          created_at?: string;
          judging_at?: string | null;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          recovery_id?: string | null;
          title?: string;
          description?: string | null;
          deadline?: string;
          stake?: number;
          status?: 'ACTIVE' | 'JUDGING' | 'SUCCESS' | 'FAILED';
          referee_code?: string;
          created_at?: string;
          judging_at?: string | null;
          settled_at?: string | null;
        };
      };
      recoveries: {
        Row: {
          id: string;
          user_id: string;
          original_prediction_id: string;
          stake: number;
          referee_code: string;
          progress: number;
          status: 'IN_PROGRESS' | 'RECOVERED' | 'FORFEITED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_prediction_id: string;
          stake: number;
          referee_code: string;
          progress?: number;
          status?: 'IN_PROGRESS' | 'RECOVERED' | 'FORFEITED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_prediction_id?: string;
          stake?: number;
          referee_code?: string;
          progress?: number;
          status?: 'IN_PROGRESS' | 'RECOVERED' | 'FORFEITED';
          created_at?: string;
          updated_at?: string;
        };
      };
      referees: {
        Row: {
          id: string;
          prediction_id: string;
          user_id: string;
          vote: 'YES' | 'NO' | null;
          voted_at: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          prediction_id: string;
          user_id: string;
          vote?: 'YES' | 'NO' | null;
          voted_at?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          prediction_id?: string;
          user_id?: string;
          vote?: 'YES' | 'NO' | null;
          voted_at?: string | null;
          joined_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          prediction_id: string;
          type: 'TEXT' | 'IMAGE';
          content: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prediction_id: string;
          type: 'TEXT' | 'IMAGE';
          content?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prediction_id?: string;
          type?: 'TEXT' | 'IMAGE';
          content?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'RECHARGE' | 'STAKE' | 'REFUND' | 'FORFEIT' | 'RECOVERY';
          amount: number;
          prediction_id: string | null;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'RECHARGE' | 'STAKE' | 'REFUND' | 'FORFEIT' | 'RECOVERY';
          amount: number;
          prediction_id?: string | null;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'RECHARGE' | 'STAKE' | 'REFUND' | 'FORFEIT' | 'RECOVERY';
          amount?: number;
          prediction_id?: string | null;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_prediction: {
        Args: {
          p_title: string;
          p_description?: string;
          p_deadline: string;
          p_stake: number;
          p_recovery_id?: string;
        };
        Returns: Database['public']['Tables']['predictions']['Row'];
      };
      trigger_judging: {
        Args: {
          p_prediction_id: string;
        };
        Returns: Database['public']['Tables']['predictions']['Row'];
      };
      cast_vote: {
        Args: {
          p_prediction_id: string;
          p_vote: 'YES' | 'NO';
        };
        Returns: Database['public']['Tables']['referees']['Row'];
      };
      join_as_referee: {
        Args: {
          p_referee_code: string;
        };
        Returns: Database['public']['Tables']['referees']['Row'];
      };
    };
    Enums: {
      prediction_status: 'ACTIVE' | 'JUDGING' | 'SUCCESS' | 'FAILED';
      user_status: 'IDLE' | 'RECOVERY';
      recovery_status: 'IN_PROGRESS' | 'RECOVERED' | 'FORFEITED';
      vote_type: 'YES' | 'NO';
      check_in_type: 'TEXT' | 'IMAGE';
      transaction_type: 'RECHARGE' | 'STAKE' | 'REFUND' | 'FORFEIT' | 'RECOVERY';
      region_type: 'global' | 'cn';
    };
  };
};

