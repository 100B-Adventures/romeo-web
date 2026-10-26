import apiClient from './client';

export const fileApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Content-Type 헤더를 명시하지 않음 — Axios가 자동으로 multipart boundary 포함
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': undefined as any,
      },
      timeout: 30000, // 이미지 업로드는 타임아웃 길게
    });

    // 응답 형식: { url: string, thumbnailUrl?: string }
    return response.data?.url || response.data?.data?.url || response.data;
  },
};
