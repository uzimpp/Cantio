export type GenerationJob = {
  job_id: string;
  song_id: string;
  status: "pending" | "processing" | "complete" | "failed";
  prompt: string;
  genre: string;
  mood: string;
  voice_type: string;
  occasion: string;
  error: string | null;
  updated_at: string;
};

export type Song = {
  id: string;
  title: string;
  audio_url: string | null;
  duration: number | null;
  is_favourited: boolean;
  is_private: boolean;
  shareable_url: string | null;
  created_at: string;
  generation_job?: GenerationJob;
};
