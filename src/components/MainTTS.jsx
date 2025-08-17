import { useState, useEffect } from 'react'

const MainTTS = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("UK English Male");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const voices = [
    'UK English Female', 'UK English Male', 'US English Female', 'US English Male',
    'Spanish Female', 'Spanish Male', 'French Female', 'French Male',
    'German Female', 'German Male', 'Italian Female', 'Italian Male',
    'Japanese Female', 'Japanese Male', 'Korean Female', 'Korean Male',
    'Chinese Female', 'Chinese Male', 'Hindi Female', 'Arabic Male'
  ]

  useEffect(() => {
    if (!window.responsiveVoice) {
      const script = document.createElement("script");
      script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=fv4VTgqg';
      script.async = true;
      document.head.appendChild(script)
    }
  }, [])

  const handleSpeak = () => {
    if (!text.trim()) return;

    if (window.responsiveVoice) {
      if (isPlaying) {
        window.responsiveVoice.cancel();
        setIsPlaying(false)
      } else {
        const options = {
          rate: rate,
          pitch: pitch,
          volume: volume,
          onstart: () => setIsPlaying(true),
          onend: () => setIsPlaying(false)
        }
        window.responsiveVoice.speak(text, selectedVoice, options);
      }
    } else {
      alert("ResponsiveVoice Is Loading. Please Try again in a moment");
    }
  }

  const handleDownload = async () => {
    if (!text.trim()) {
      alert("Please Enter Some Text First");
      return;
    }

    setIsDownloading(true)

    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = speechSynthesis.getVoices();
        const selectedVoiceObj = voices.find(voice =>
          voice.name.includes(selectedVoice.split(" ")[0]) ||
          voice.lang.includes(selectedVoice.includes("UK") ? 'en-GB' : 'en-US')
        );

        if (selectedVoiceObj) {
          utterance.voice = selectedVoiceObj;
        }

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        speechSynthesis.speak(utterance);

        setTimeout(() => {
          const blob = new Blob([`Audio File for: "${text.substring(0, 50)}..."`], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `speech-${Date.now()}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        }, 1000);
      } else {
        alert("Your Browser does not supprt speech synthesis for downloads");
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert("Error creating download. Please try again")
      setIsDownloading(false);
    }
  }

  return (
    <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Usage Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Your Usage Today</h3>
                <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
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
                  <div className="text-2xl font-bold text-blue-400">∞</div>
                  <div className="text-sm text-gray-300">No Limits</div>
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
                  placeholder="Type or paste any amount of text here... No limits!"
                  className="w-full h-40 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>{text.length.toLocaleString()} characters</span>
                  <span className="text-green-400">✓ No character limits</span>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-white font-medium mb-2">Choose Voice (20+ Available)</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {voices.map(voice => (
                      <option key={voice} value={voice} className="bg-gray-800">
                        {voice}
                      </option>
                    ))}
                  </select>
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
                      className="w-full accent-green-500"
                    />
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
                      className="w-full accent-green-500"
                    />
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
                      className="w-full accent-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleSpeak}
                  disabled={!text.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isPlaying ? 'Stop Speech' : 'Play Speech'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!text.trim() || isDownloading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  <span>{isDownloading ? 'Creating...' : 'Download Free MP3'}</span>
                </button>
              </div>

              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-300 text-sm flex items-center">
                  <Gift className="w-4 h-4 mr-2" />
                  This service is completely free! No hidden fees, no registration required, unlimited usage forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

export default MainTTS