import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export const createPosition = async (userId: string, usdcAmount: number, bnbAmount: number) => {
  const { data, error } = await supabase
    .from('positions')
    .insert([
      {
        user_id: userId,
        usdc_amount: usdcAmount,
        bnb_amount: bnbAmount,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserPositions = async (userId: string) => {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updatePrice = async (token: string, price: number) => {
  const { data, error } = await supabase
    .from('price_history')
    .insert([
      {
        token,
        price,
        timestamp: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
  return data;
};

export const getLatestPrice = async (token: string) => {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('token', token)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};