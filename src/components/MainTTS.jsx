import {useState, useEffect } from 'react'

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
    if(!window.responsiveVoice) {
      const script = document.createElement("script");
      script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=fv4VTgqg';
      script.async = true;
      document.head.appendChild(script)
    }
  }, [])

  const handleSpeak = () => {
    if(!text.trim()) return;

    if(window.responsiveVoice){
      if(isPlaying) {
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
        window.responsiveVoice.speak(text,selectedVoice, options);
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
      if("speechSynthesis" in  window) {
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = speechSynthesis.getVoices();
        const selectedVoiceObj = voices.find(voice => 
          voice.name.includes(selectedVoice.split(" ") [0]) || 
          voice.lang.includes(selectedVoice.includes("UK") ? 'en-GB' : 'en-US')
        );

        if(selectedVoiceObj) {
          utterance.voice = selectedVoiceObj;
        }

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        speechSynthesis.speak(utterance);

        setTimeout(() => {
          const blob = new Blob([`Audio File for: "${text.substring(0, 50)}..."`], {type: 'text/plain'});
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
    <main>
      <div className="container mx-auto mb-6">
        <label className="block text-black font-medium mb-3">Enter Your Text</label>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type or paste any amount of text here... No Limits'
          className='w-full h-40 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y' 
        />
        <div className='flex justify-between mt-2 text-sm text-gray-400'>
          <span>{text.length.toLocaleString()} Characters</span>
          <span className='text-green-400'>No Character limits</span>

        </div>
      </div>
    </main>
  )
}

export default MainTTS