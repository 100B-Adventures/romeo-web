import apiClient from './client';

export const heartApi = {
  getBalance: async (): Promise<{ balance: number }> => {
    const response = await apiClient.get('/hearts/balance');
    return response.data;
  },

  claimNoRecommendationBonus: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/hearts/no-recommendation-bonus');
    return response.data;
  },
};

