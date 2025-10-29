export interface UploadCardResponse {
  status: 200;
  message: "User Card Image is stored and being processed";
  transactionID: string;
}

export interface ScheduleMeetingResponse {
  status: 200;
  message: "Meeting Invitation request is Received";
  transactionID: string;
}

export interface UserInfo {
  transaction_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  company: string | null;
  is_meeting_requested: boolean;
  created_at?: string;
}

export interface BusinessCardData {
  transaction_id: string;
  image_url: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  llm_response: LLMResponse | null;
  created_at?: string;
  processed_at?: string | null;
}

export interface LLMResponse {
  extracted_data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    address?: string;
    [key: string]: any;
  };
  confidence_score?: number;
  processing_time_ms?: number;
}

export type CardScanStep = 'landing' | 'capture' | 'processing' | 'result' | 'meetingScheduler' | 'confirmation';

export interface CardScanState {
  step: CardScanStep;
  transactionID: string | null;
  capturedImage: File | null;
  extractedData: UserInfo | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | null;
  isLoading: boolean;
  error: string | null;
}
