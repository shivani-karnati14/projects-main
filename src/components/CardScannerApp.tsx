import { useState, useEffect } from 'react';
import { LandingScreen } from './screens/LandingScreen';
import { CardCaptureScreen } from './screens/CardCaptureScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ResultScreen } from './screens/ResultScreen';
import { MeetingSchedulerModal } from './features/MeetingSchedulerModal';
import { MeetingConfirmationScreen } from './screens/MeetingConfirmationScreen';
import { Toast } from './ui/Toast';
import { CardScannerAPI } from '../services/api';
import type { CardScanState, UserInfo, BusinessCardData } from '../types/cardScanner';

export function CardScannerApp() {
  const [state, setState] = useState<CardScanState>({
    step: 'landing',
    transactionID: null,
    capturedImage: null,
    extractedData: null,
    processingStatus: null,
    isLoading: false,
    error: null,
  });

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Poll for processing status
  useEffect(() => {
    if (state.transactionID && state.step === 'processing') {
      const interval = setInterval(async () => {
        try {
          const data = await CardScannerAPI.checkProcessingStatus(state.transactionID!);
          setBusinessCardData(data);

          console.log('📊 Processing status:', data.processing_status);
          console.log('📊 LLM Response:', data.llm_response);

          if (data.processing_status === 'completed') {
            // Fetch user info from database
            const userInfo = await CardScannerAPI.getUserInfo(state.transactionID!);
            
            console.log('👤 User info from database:', userInfo);

            // Merge data from both sources - prioritize LLM extracted data if database fields are null
            const extractedData = data.llm_response?.extracted_data;
            
            const mergedUserInfo: UserInfo = {
              transaction_id: userInfo.transaction_id,
              email: userInfo.email || extractedData?.email || null,
              name: userInfo.name || extractedData?.name || null,
              phone: userInfo.phone || extractedData?.phone || null,
              company: userInfo.company || extractedData?.company || null,
              is_meeting_requested: userInfo.is_meeting_requested || false,
              created_at: userInfo.created_at,
            };

            console.log('✅ Merged user info:', mergedUserInfo);
            console.log('📧 Final email value:', mergedUserInfo.email);

            setState(prev => ({
              ...prev,
              step: 'result',
              extractedData: mergedUserInfo,
              processingStatus: 'completed',
            }));
            clearInterval(interval);
          } else if (data.processing_status === 'failed') {
            setState(prev => ({
              ...prev,
              processingStatus: 'failed',
              error: 'Processing failed. Please try again.',
            }));
            setToast({ message: 'Processing failed. Please try again.', type: 'error' });
            clearInterval(interval);
          }
        } catch (err) {
          console.error('❌ Error checking status:', err);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [state.transactionID, state.step]);

  const handleStartScan = () => {
    setState(prev => ({ ...prev, step: 'capture' }));
  };

  const handleCapture = async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      capturedImage: file,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('📤 Uploading file:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
      
      const response = await CardScannerAPI.uploadCard(file);
      
      console.log('✅ Upload response:', response);
      
      setState(prev => ({
        ...prev,
        step: 'processing',
        transactionID: response.transactionID,
        processingStatus: 'pending',
        isLoading: false,
      }));
      setToast({ message: 'Card uploaded successfully!', type: 'success' });
    } catch (err) {
      console.error('❌ Upload error:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to upload card',
        isLoading: false,
      }));
      setToast({ message: 'Failed to upload card', type: 'error' });
    }
  };

  const handleCancelCapture = () => {
    setState(prev => ({ ...prev, step: 'landing' }));
  };

  const handleScheduleMeeting = () => {
    if (state.extractedData) {
      console.log('🗓️ Opening meeting scheduler for:', state.extractedData);
      console.log('📧 Email check:', state.extractedData.email);
      
      if (!state.extractedData.email) {
        setToast({ 
          message: 'No email address found in the business card. Cannot schedule meeting.', 
          type: 'error' 
        });
        return;
      }
      
      setShowMeetingModal(true);
    }
  };

  const handleConfirmMeeting = async () => {
    if (!state.transactionID) return;

    try {
      console.log('📨 Scheduling meeting for transaction:', state.transactionID);
      
      const response = await CardScannerAPI.scheduleMeeting(state.transactionID);
      
      console.log('✅ Meeting scheduled:', response);
      
      setShowMeetingModal(false);
      setState(prev => ({
        ...prev,
        step: 'confirmation',
        extractedData: prev.extractedData ? {
          ...prev.extractedData,
          is_meeting_requested: true,
        } : null,
      }));
      setToast({ message: 'Meeting invitation sent!', type: 'success' });
    } catch (err) {
      console.error('❌ Meeting scheduling error:', err);
      setToast({ message: 'Failed to schedule meeting', type: 'error' });
    }
  };

  const handleScanAnother = () => {
    setState({
      step: 'landing',
      transactionID: null,
      capturedImage: null,
      extractedData: null,
      processingStatus: null,
      isLoading: false,
      error: null,
    });
    setBusinessCardData(null);
  };

  const handleDone = () => {
    handleScanAnother();
  };

  return (
    <>
      {state.step === 'landing' && (
        <LandingScreen onStartScan={handleStartScan} />
      )}

      {state.step === 'capture' && (
        <CardCaptureScreen 
          onCapture={handleCapture} 
          onCancel={handleCancelCapture}
        />
      )}

      {state.step === 'processing' && state.transactionID && (
        <ProcessingScreen transactionID={state.transactionID} />
      )}

      {state.step === 'result' && state.extractedData && (
        <ResultScreen
          userInfo={state.extractedData}
          llmResponse={businessCardData?.llm_response || null}
          processingStatus={state.processingStatus || 'pending'}
          onScheduleMeeting={handleScheduleMeeting}
          onScanAnother={handleScanAnother}
        />
      )}

      {state.step === 'confirmation' && state.transactionID && (
        <MeetingConfirmationScreen
          transactionID={state.transactionID}
          onDone={handleDone}
        />
      )}

      {state.extractedData && (
        <MeetingSchedulerModal
          isOpen={showMeetingModal}
          onClose={() => setShowMeetingModal(false)}
          userInfo={state.extractedData}
          onConfirm={handleConfirmMeeting}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
