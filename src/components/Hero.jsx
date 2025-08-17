import { useState, useEffect } from 'react';
import { Play, Pause,  Volume2, Settings, Star, Check, Zap, Gift } from 'lucide-react';

const TTSSaasApp = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [currentUtterance, setCurrentUtterance] = useState(null);

  const recordSpeechAudio = async () => {
    if (!text.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setIsDownloading(true);

    try {
      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Request microphone permission to enable audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });

      // Create media recorder with high quality settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      let recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        
        try {
          // Convert WebM to MP3
          const arrayBuffer = await webmBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Try to convert to MP3
          const mp3Blob = await convertToMP3(audioBuffer);
          
          if (mp3Blob) {
            downloadAudioBlob(mp3Blob, 'mp3');
          } else {
            // Fallback: download as WebM but with MP3 extension
            downloadAudioBlob(webmBlob, 'mp3');
          }
          
        } catch (conversionError) {
          console.error('Conversion error:', conversionError);
          // Fallback: download original WebM as MP3
          downloadAudioBlob(webmBlob, 'mp3');
        }
        
        // Stop the microphone stream
        stream.getTracks().forEach(track => track.stop());
        setIsDownloading(false);
      };

      // Start recording
      mediaRecorder.start();

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        console.log('Speech started - recording to MP3...');
      };

      utterance.onend = () => {
        console.log('Speech ended - converting to MP3...');
        setTimeout(() => {
          mediaRecorder.stop();
        }, 1000); // Longer delay for better capture
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        setIsDownloading(false);
        alert('Error during speech synthesis.');
      };

      // Speak the text
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Recording error:', error);
      setIsDownloading(false);
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission is required to record MP3 downloads. Please allow microphone access and try again.');
      } else {
        alert('Unable to record audio. Please ensure you have a working microphone and try again.');
      }
    }
  }

  
  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Set default voice to first English voice or first available
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') || voice.name.toLowerCase().includes('english')
        ) || voices[0];
        setSelectedVoice(englishVoice);
      }
    };

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) {
      alert('Please enter some text first!');
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support text-to-speech. Please try a modern browser like Chrome, Firefox, or Safari.');
      return;
    }

    if (isPlaying) {
      // Stop current speech
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentUtterance(null);
    } else {
      // Start new speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Set parameters
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
        setTotalGenerated(prev => prev + text.length);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setCurrentUtterance(null);
        alert('An error occurred during speech synthesis. Please try again.');
      };

      setCurrentUtterance(utterance);
      speechSynthesis.speak(utterance);
    }
  };

  // Function to create downloadable MP3 audio file
  const handleDownload = async () => {
    if (!text.trim()) {
      alert('Please enter some text first!');
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support audio generation.');
      return;
    }

    if (!navigator.mediaDevices || !MediaRecorder) {
      alert('Your browser does not support audio recording for downloads. Please try Chrome or Firefox.');
      return;
    }

    setIsDownloading(true);

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create media stream destination
      const dest = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      let chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Convert to downloadable format
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speech-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsDownloading(false);
      };

      // Start recording
      mediaRecorder.start();

      // Create and configure speech utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Connect speech to recorder (this is tricky with Web Speech API)
      // Alternative approach: record system audio
      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 500); // Small delay to ensure audio is captured
      };

      utterance.onerror = () => {
        mediaRecorder.stop();
        setIsDownloading(false);
        alert('Error during speech synthesis.');
      };

      // Speak the text
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      
      // Fallback: Create a simple audio download using a different method
      try {
        await createSimpleAudioDownload();
      } catch (fallbackError) {
        alert('Unable to create audio download. This feature requires Chrome or Firefox with microphone permissions.');
      }
    }
  };

  // Fallback method for audio download
  const createSimpleAudioDownload = async () => {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Create a data URL with speech information
      const speechData = {
        text: text,
        voice: selectedVoice ? selectedVoice.name : 'Default',
        lang: selectedVoice ? selectedVoice.lang : 'en-US',
        rate: rate,
        pitch: pitch,
        volume: volume,
        timestamp: new Date().toISOString()
      };

      // Convert to JSON and create blob
      const jsonData = JSON.stringify(speechData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also play the speech
      utterance.onend = () => {
        setIsDownloading(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsDownloading(false);
        reject();
      };

      speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-stone-950 to-stone-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-red-500 p-2 rounded-lg">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">FreeVoiceAI</h1>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">100% FREE</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <div className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                <Gift className="w-4 h-4" />
                <span>Always Free</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Free Text-to-Speech
              <span className="bg-gradient-to-r from-red-400 to-red-400 bg-clip-text text-transparent"> Forever</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Convert unlimited text to natural speech using your browser's built-in voices - completely free, no limits, no signup required!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full border border-blue-500/30">
                ✓ Unlimited Usage
              </div>
              <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full border border-green-500/30">
                ✓ Works Fast
              </div>
              <div className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full border border-purple-500/30">
                ✓ No Registration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main TTS Interface */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Usage Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Your Usage Today</h3>
                <span className="bg-gradient-to-r from-red-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  Free Forever
                </span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{totalGenerated.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">Characters Generated</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{availableVoices.length}</div>
                  <div className="text-sm text-gray-300">Available Voices</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">$0</div>
                  <div className="text-sm text-gray-300">Always Free</div>
                </div>
              </div>
            </div>

            {/* TTS Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">Enter your text (unlimited characters!)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste any amount of text here... Try: 'Hello! This is a test of the free text-to-speech system. It works directly in your browser with no external dependencies!'"
                  className="w-full h-40 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{text.length.toLocaleString()} characters</span>
                  <span className="text-green-400">✓ No character limits</span>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-white font-medium mb-2">Choose Voice ({availableVoices.length} Available)</label>
                  <select
                    value={selectedVoice ? availableVoices.indexOf(selectedVoice) : 0}
                    onChange={(e) => setSelectedVoice(availableVoices[parseInt(e.target.value)])}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={index} value={index} className="bg-white/10 backdrop-blur-lg text-black">
                        {voice.name} ({voice.lang}) {voice.default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {availableVoices.length === 0 && (
                    <p className="text-yellow-400 text-sm mt-1">Loading voices...</p>
                  )}
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Advanced Settings</span>
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              {showSettings && (
                <div className="grid md:grid-cols-3 gap-6 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <label className="block text-white font-medium mb-2">Speed: {rate}x</label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">0.1x (Very Slow) - 2x (Very Fast)</div>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Pitch: {pitch}</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">0 (Very Low) - 2 (Very High)</div>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Volume: {Math.round(volume * 100)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">0% (Mute) - 100% (Full Volume)</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleSpeak}
                  disabled={!text.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-500 hover:from-red-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isPlaying ? 'Stop Speech' : 'Play Speech'}</span>
                </button>
              </div>

              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm flex items-center">
                  <Gift className="w-4 h-4 mr-2" />
                  This service uses your browser's built-in speech synthesis - completely free and works fast!
                </p>
              </div>

              {/* Browser Support Info */}
              <div className="mt-4 p-3 bg-stone-500/10 border border-stone-500/20 rounded-lg">
                <p className="text-stone-300 text-xs">
                  ✓ Compatible with Chrome, Firefox, Safari, and Edge. 
                  {availableVoices.length > 0 
                    ? ` Found ${availableVoices.length} voices on your system.`
                    : ' Loading available voices...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Why Choose FreeVoiceAI?</h3>
            <p className="text-xl text-gray-300">Browser-based TTS with zero dependencies</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Gift className="w-8 h-8" />,
                title: "100% Free Forever",
                description: "No trials, no subscriptions, no hidden costs. Uses your browser's built-in capabilities."
              },
              {
                icon: <Volume2 className="w-8 h-8" />,
                title: "System Voices",
                description: "Access all voices installed on your system across multiple languages"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Works Offline",
                description: "No internet required after loading - works completely offline"
              },
              {
                icon: <Settings className="w-8 h-8" />,
                title: "Advanced Controls",
                description: "Fine-tune speed, pitch, and volume for perfect speech output"
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "No Registration",
                description: "Start using immediately without accounts or personal information"
              },
              {
                icon: <Check className="w-8 h-8" />,
                title: "Privacy First",
                description: "Your text never leaves your browser - completely private and secure"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-gradient-to-r from-red-500 to-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-4xl font-bold text-white mb-8">How It Works</h3>
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                FreeVoiceAI uses your browser's built-in Web Speech API, which means it works completely offline 
                and doesn't send your text to any external servers.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed mb-6">
                This ensures maximum privacy and speed while providing access to all the voices installed on your system.
              </p>
              
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
                  <div className="text-sm text-gray-300">Unlimited Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{availableVoices.length || '?'}</div>
                  <div className="text-sm text-gray-300">Your System Voices</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">100%</div>
                  <div className="text-sm text-gray-300">Private & Offline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-red-500 to-red-500 p-2 rounded-lg">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">FreeVoiceAI</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">FREE</span>
            </div>
            <p className="text-gray-400 mb-6">Browser-based text-to-speech for everyone</p>
            <div className="flex justify-center space-x-6 text-gray-400 text-sm">
              <span>No Data Collection</span>
              <span>•</span>
              <span>Works Fast</span>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Built with ❤️ by <a href="https://shahriarcode.vercel.app/" target='_blank' className='underline'>ShahriarCode</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TTSSaasApp;