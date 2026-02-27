// Web Speech API를 사용한 음성 인식 서비스

// 브라우저 호환성 체크
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export interface SpeechRecognitionConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback?: (transcript: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor(config: SpeechRecognitionConfig = {}) {
    if (!SpeechRecognition) {
      throw new Error('Web Speech API를 지원하지 않는 브라우저입니다. Chrome 또는 Edge를 사용해주세요.');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = config.lang || 'ko-KR';
    this.recognition.continuous = config.continuous !== undefined ? config.continuous : true;
    this.recognition.interimResults = config.interimResults !== undefined ? config.interimResults : true;
    this.recognition.maxAlternatives = config.maxAlternatives || 1;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResultCallback) {
        if (finalTranscript) {
          this.onResultCallback(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.onResultCallback(interimTranscript.trim(), false);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (this.onErrorCallback) {
        let errorMessage = '음성 인식 오류가 발생했습니다.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
            break;
          case 'audio-capture':
            errorMessage = '마이크를 찾을 수 없습니다.';
            break;
          case 'not-allowed':
            errorMessage = '마이크 권한이 거부되었습니다.';
            break;
          case 'network':
            errorMessage = '네트워크 오류가 발생했습니다.';
            break;
        }
        
        this.onErrorCallback(errorMessage);
      }
      
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // continuous 모드에서 자동으로 재시작
      if (this.isListening) {
        console.log('Restarting recognition...');
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          this.isListening = false;
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        }
      } else {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    };

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
    };
  }

  start() {
    if (this.isListening) {
      console.warn('Speech recognition is already running');
      return;
    }

    try {
      this.recognition.start();
      console.log('Starting speech recognition...');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      throw error;
    }
  }

  stop() {
    if (!this.isListening) {
      console.warn('Speech recognition is not running');
      return;
    }

    this.isListening = false;
    this.recognition.stop();
    console.log('Stopping speech recognition...');
  }

  onResult(callback: (transcript: string, isFinal: boolean) => void) {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  isRecording(): boolean {
    return this.isListening;
  }
}

// 브라우저 지원 여부 체크
export const isSpeechRecognitionSupported = (): boolean => {
  return !!SpeechRecognition;
};
