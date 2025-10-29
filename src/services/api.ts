import type { UploadCardResponse, ScheduleMeetingResponse, BusinessCardData, UserInfo } from '../types/cardScanner';

const API_BASE_URL = 'http://localhost:8000';

export class CardScannerAPI {
  /**
   * Upload and process business card image
   */
  static async uploadCard(imageFile: File): Promise<UploadCardResponse> {
    // Validation
    if (!imageFile) {
      throw new Error('No file provided');
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error(`Invalid file type. Please upload a JPEG or PNG image.`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      throw new Error(`File size exceeds 10MB limit.`);
    }

    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name);
    
    console.log('📤 Uploading card image:', imageFile.name, imageFile.type, `${(imageFile.size / 1024).toFixed(2)}KB`);

    const response = await fetch(`${API_BASE_URL}/api/persistNprocessCapturedCard`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload error:', response.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Upload failed: ${response.status}`);
      } catch {
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;
  }

  /**
   * Schedule a meeting for a contact
   */
  static async scheduleMeeting(transactionID: string): Promise<ScheduleMeetingResponse> {
    const response = await fetch(`${API_BASE_URL}/api/intiateMeetingScheduler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transactionID, 
        isMeetingRequested: true 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to schedule meeting: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Check processing status of a card
   */
  static async checkProcessingStatus(transactionID: string): Promise<BusinessCardData> {
    const response = await fetch(`${API_BASE_URL}/api/checkCardStatus/${transactionID}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Fetch extracted user info
   */
  static async getUserInfo(transactionID: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/api/getUserInfo/${transactionID}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('📥 Raw getUserInfo response:', result);
    
    // Backend returns: { status: 200, transactionID: "...", data: {...}, exists: true }
    // Extract the nested data object
    if (result.data) {
      console.log('✅ Extracted user data:', result.data);
      return {
        transaction_id: result.transactionID || result.data.transaction_id,
        email: result.data.email || null,
        name: result.data.name || null,
        phone: result.data.phone || null,
        company: result.data.company || null,
        is_meeting_requested: result.data.is_meeting_requested || false,
        created_at: result.data.created_at,
      };
    }
    
    // Fallback if data structure is different
    console.warn('⚠️ Unexpected response structure, using result directly');
    return result;
  }
}
