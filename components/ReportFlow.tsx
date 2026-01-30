import React, { useRef, useState, useEffect } from 'react';
import { LocationData, AIReportAnalysis, CivicReport } from '../types';
import { analyzeCivicReport } from '../services/geminiService';
import { getAddressFromCoords } from '../services/locationService';

interface ReportFlowProps {
  location: LocationData | null;
  onClose: () => void;
  onSave: (report: CivicReport) => void;
  userId: string;
}

export const ReportFlow: React.FC<ReportFlowProps> = ({ location, onClose, onSave, userId }) => {
  const [step, setStep] = useState<'CAMERA' | 'DETAILS' | 'ANALYZING' | 'RESULT'>('CAMERA');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<AIReportAnalysis | null>(null);
  const [address, setAddress] = useState<string>('Fetching location...');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev + ' ' + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }

  const startVoiceInput = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    } else {
      alert('Voice input is not supported in your browser.');
    }
  };

  const stopVoiceInput = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Compress image to reduce size for localStorage
  const compressImage = (dataUrl: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    if (step === 'CAMERA') startCamera();
    return () => stopCamera();
  }, [step]);

  useEffect(() => {
    if (location) {
      getAddressFromCoords(location.latitude, location.longitude).then(setAddress);
    } else {
      setAddress("Location unavailable");
    }
  }, [location]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Camera access denied - user can still upload images
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawImage = canvas.toDataURL('image/jpeg', 0.8);
        // Compress before storing
        compressImage(rawImage).then(compressed => {
          setImages(prev => [...prev, compressed]);
        });
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setImages(prev => [...prev, compressed]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setStep('ANALYZING');

    try {
      // Step 1: AI Analysis
      const analysis = await analyzeCivicReport(description, images, location);

      if (!analysis) {
        throw new Error('AI analysis failed - please try again');
      }

      setResult(analysis);
      setStep('RESULT');

      // Step 2: Create report object (ID will be generated by Firestore)
      const newReport: CivicReport = {
        id: '', // Will be set by Firestore
        userId,
        images,
        description,
        location,
        address,
        timestamp: new Date(),
        status: 'SUBMITTED',
        statusHistory: [{
          status: 'SUBMITTED',
          timestamp: new Date(),
          updatedBy: userId,
          comment: 'Report submitted by citizen'
        }],
        analysis: {
          category: analysis.category,
          urgency: analysis.urgency,
          department: analysis.department,
          officialSummary: analysis.officialSummary,
          estimatedAction: analysis.estimatedAction
        },
        upvotes: 0,
        upvotedBy: [],
        comments: [],
        isRecurring
      };

      // Step 3: Save to Firestore via parent handler
      onSave(newReport);
    } catch (error: any) {
      setStep('DETAILS'); // Go back to details screen
      alert(`Submission failed: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  // =============== CAMERA SCREEN ===============
  if (step === 'CAMERA') {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

          {/* Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
            {/* Center focus indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-2xl"></div>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start bg-gradient-to-b from-black/70 via-black/30 to-transparent">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-2 border border-white/10">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              {images.length} Photo{images.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 0 && (
            <div className="absolute bottom-40 left-0 right-0 flex gap-3 px-5 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/50 shadow-xl group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <div className="flex justify-between items-center">
              {/* Gallery */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />

              {/* Shutter Button */}
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center active:scale-90 transition-all relative group"
              >
                <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 transition-transform shadow-lg" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              {/* Next */}
              <button
                onClick={() => images.length > 0 && setStep('DETAILS')}
                disabled={images.length === 0}
                className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${images.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-95'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // =============== DETAILS SCREEN ===============
  if (step === 'DETAILS') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 z-50 flex flex-col">
        {/* Premium Header */}
        <header className="relative bg-white dark:bg-slate-800 px-5 py-4 border-b border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('CAMERA')} className="p-2.5 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">Review Report</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Step 2 of 3</p>
            </div>
            <button 
              onClick={() => setStep('CAMERA')} 
              className="px-3 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              + Add
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          {/* Image Grid */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-sm">📷</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white">Evidence Photos</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{images.length} photo{images.length !== 1 ? 's' : ''} captured</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden relative shadow-md group border-2 border-transparent hover:border-blue-400 transition-all">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-xs font-bold text-gray-700">
                    {idx + 1}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setStep('CAMERA')}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all bg-gray-50 dark:bg-slate-700/50"
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-[10px] font-medium">Add More</span>
              </button>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">📍 Location Detected</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{address}</p>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </section>

          {/* Description with Voice */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm">✏️</span>
                </div>
                <label className="text-sm font-bold text-gray-900 dark:text-white">Description</label>
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Optional</span>
              </div>
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                  }`}
              >
                {isListening ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Listening...
                  </>
                ) : (
                  <>
                    <span>🎤</span>
                    Voice
                  </>
                )}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in your own words (you can also use voice input)..."
              className="w-full h-28 p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all text-sm"
            />
          </section>

          {/* Recurring Toggle */}
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Recurring Issue?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mark if this problem keeps happening</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isRecurring ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-200 dark:bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isRecurring ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </section>
        </div>

        {/* Submit Button */}
        <div className="p-5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 safe-area-bottom">
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all"
          >
            <span className="text-xl">🤖</span>
            Analyze & Submit Report
          </button>
        </div>
      </div>
    );
  }

  // =============== ANALYZING SCREEN ===============
  if (step === 'ANALYZING') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 z-50 flex flex-col items-center justify-center p-8 text-center">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Animated Scanner */}
        <div className="relative w-40 h-40 mb-10">
          {/* Image preview with scan effect */}
          {images[0] && (
            <div className="w-full h-full rounded-3xl overflow-hidden relative border-2 border-white/20 shadow-2xl">
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan shadow-[0_0_20px_5px_rgba(96,165,250,0.5)]" />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
            </div>
          )}

          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/30 animate-pulse-ring" />
          <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/10 animate-pulse-ring" style={{ animationDelay: '1s' }} />

          {/* AI badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
            <span className="text-sm">🤖</span> AI Processing
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-3">Analyzing Evidence</h2>
        <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
          Our AI is identifying the issue type, urgency level, and responsible department...
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Steps indicator */}
        <div className="mt-10 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[10px]">✓</span>
            Photo Analysis
          </span>
          <span className="w-8 h-px bg-slate-700"></span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </span>
            Classification
          </span>
          <span className="w-8 h-px bg-slate-700"></span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">3</span>
            Routing
          </span>
        </div>
      </div>
    );
  }

  // =============== RESULT SCREEN ===============
  if (step === 'RESULT' && result) {
    const isCritical = result.urgency === 'Critical' || result.urgency === 'High';
    const ticketId = `UDA-${Math.floor(Math.random() * 100000)}`;

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 z-50 flex flex-col">
        {/* Success Header */}
        <div className="relative bg-white dark:bg-slate-800 p-8 pb-12 rounded-b-[40px] shadow-xl text-center overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Success Icon */}
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30 rotate-3">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Pulse */}
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-pulse-ring" />
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Report Submitted!</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ticket ID:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">#{ticketId}</span>
            </div>

            {isRecurring && (
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                  🔄 Marked as Recurring Issue
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 -mt-4 space-y-4">
          {/* AI Analysis Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Analysis Result</h3>
            </div>

            {/* Category & Urgency */}
            <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Issue Detected</p>
                <p className="font-black text-gray-900 dark:text-white text-xl">{result.category}</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${isCritical 
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
              }`}>
                {result.urgency}
              </span>
            </div>

            {/* Department */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-2">Assigned Department</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-xl">🏛️</span>
                </div>
                <span className="font-bold text-blue-900 dark:text-blue-100 text-lg">{result.department}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">📝 Official Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">"{result.officialSummary}"</p>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Expected Action</h3>
            </div>
            <p className="text-emerald-800 dark:text-emerald-200 font-medium text-sm leading-relaxed">{result.estimatedAction}</p>
          </div>
        </div>

        {/* Done Button */}
        <div className="p-5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 safe-area-bottom">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};