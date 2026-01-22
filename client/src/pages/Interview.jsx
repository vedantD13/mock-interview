import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, Mic, MicOff, Code, Layout, XCircle, CheckCircle, Home, 
  Play, Terminal, Volume2, VolumeX, AlertCircle 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown'; // NEW: For formatting text

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(location.state?.sessionId || null);

  // Chat State
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! I am ready to start your technical interview. Introduce yourself or say "ready" to begin.' },
  ]);

  // Settings
  const [isMuted, setIsMuted] = useState(false); // NEW: Mute state

  // Media & Tabs
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Code Editor
  const [userCode, setUserCode] = useState("// Write your solution here\nconsole.log('Hello World');");
  const [codeOutput, setCodeOutput] = useState([]);

  // --- 1. WEBCAM ---
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error("Webcam Error:", err); }
    };
    if (activeTab === 'analysis' && !feedback) startWebcam();
  }, [activeTab, feedback]);

  // --- 2. TEXT-TO-SPEECH (With Mute Check) ---
  const speak = (text) => {
    if (isMuted) return; // Don't speak if muted
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- 3. SPEECH-TO-TEXT ---
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => setInput(prev => prev + " " + e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else { alert("Browser does not support speech recognition."); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // --- 4. SEND MESSAGE ---
  const sendMessage = async (manualText = null) => {
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!manualText) setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId || 'guest_session', userMessage: userMsg.text })
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sessionId && data.sessionId !== sessionId) setSessionId(data.sessionId);
        
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.reply }]);
        speak(data.reply);
        
        if (data.reply.toLowerCase().includes("code")) setActiveTab('code');
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally { setIsTyping(false); }
  };

  // --- 5. END INTERVIEW ---
  const endInterview = async () => {
    if (!sessionId) return alert("No active session.");
    setLoadingFeedback(true);
    try {
      const res = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) { alert("Failed to generate feedback."); } finally { setLoadingFeedback(false); }
  };

  // --- 6. RUN CODE ---
  const runCode = () => {
    setCodeOutput([]);
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      const formatted = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg));
      logs.push(formatted.join(' '));
    };
    try {
      // eslint-disable-next-line no-new-func
      new Function(userCode)();
    } catch (error) { logs.push(`❌ Error: ${error.message}`); }
    console.log = originalLog;
    setCodeOutput(logs);
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 p-4 gap-6 font-sans overflow-hidden relative">
      
      {/* FEEDBACK MODAL */}
      {(feedback || loadingFeedback) && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
          {loadingFeedback ? (
            <div className="text-white text-xl animate-pulse font-semibold">Generating Report...</div>
          ) : (
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Results</h2>
                <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-xl">{feedback.rating}/10</div>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                   <h3 className="font-bold text-green-800 mb-2">Feedback</h3><p>{feedback.feedback}</p>
                 </div>
                 <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                   <h3 className="font-bold text-amber-800 mb-2">Improvement</h3><p>{feedback.improvement}</p>
                 </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800">Back to Home</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- LEFT SIDE: CHAT --- */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="font-bold text-xl text-gray-800">Technical Interview</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span>Live Session</span>
            </div>
          </div>
          <div className="flex gap-2">
             {/* MUTE BUTTON */}
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
               title={isMuted ? "Unmute AI" : "Mute AI"}
             >
               {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>

             <button onClick={endInterview} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 flex items-center gap-2">
               <XCircle size={18} /> End
             </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center mr-3 shadow-md shrink-0 text-white text-xs font-bold">AI</div>
              )}
              
              <div className={`max-w-[85%] p-4 text-[15px] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-gray-900 text-white rounded-2xl rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none'
              }`}>
                {/* MARKDOWN RENDERER */}
                {msg.sender === 'ai' ? (
                  <ReactMarkdown 
                    components={{
                      // Custom styles for Markdown elements
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <span className="font-bold text-indigo-700" {...props} />,
                      code: ({node, inline, ...props}) => (
                         inline 
                           ? <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded font-mono text-sm" {...props} />
                           : <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs my-2 overflow-x-auto" {...props} />
                      )
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          
          {/* TYPING ANIMATION BUBBLE */}
          {isTyping && (
             <div className="flex w-full justify-start animate-fade-in-up">
               <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center mr-3 shadow-md shrink-0 text-white text-xs font-bold">AI</div>
               <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-5 bg-white border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100">
            <input 
               type="text" className="flex-1 bg-transparent px-4 py-2 focus:outline-none" 
               placeholder="Type your answer..." value={input} 
               onChange={(e) => setInput(e.target.value)} 
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
            />
            <button onClick={startListening} className={`p-2 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400'}`}>
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button onClick={() => sendMessage()} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md"><Send size={20} /></button>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: TABS --- */}
      <div className="w-[500px] hidden xl:flex flex-col gap-4 shrink-0 h-full">
         <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
           <button onClick={() => setActiveTab('analysis')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg ${activeTab === 'analysis' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}><Layout size={18}/> Analysis</button>
           <button onClick={() => setActiveTab('code')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg ${activeTab === 'code' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}><Code size={18}/> Code</button>
         </div>

         {activeTab === 'analysis' ? (
           <>
             <div className="h-64 bg-gray-900 rounded-2xl relative overflow-hidden shadow-lg border border-gray-800">
               <video ref={videoRef} autoPlay muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
               <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20"><span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-green-500/50"></span><span className="text-white text-xs font-bold">YOU</span></div>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
               <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><AlertCircle size={20} className="text-indigo-500" /> Live Analysis</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2"><span>Confidence</span><span className="text-green-600 font-bold">High</span></div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[85%] rounded-full"></div></div>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100">
                    💡 <strong>Tip:</strong> Speak clearly and maintain eye contact.
                  </div>
               </div>
             </div>
           </>
         ) : (
           <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
             <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500 uppercase">JS</span>
               <div className="flex gap-2">
                 <button onClick={runCode} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 flex items-center gap-1 font-semibold"><Play size={12}/> Run</button>
                 <button onClick={() => { sendMessage(`Review Code:\n\`\`\`javascript\n${userCode}\n\`\`\``); setActiveTab('analysis'); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center gap-1 font-semibold"><CheckCircle size={12}/> Submit</button>
               </div>
             </div>
             <div className="flex-1 relative"><Editor height="100%" defaultLanguage="javascript" value={userCode} onChange={setUserCode} theme="light" options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }} /></div>
             <div className="h-40 bg-gray-900 text-gray-300 p-4 font-mono text-sm overflow-y-auto border-t border-gray-800">
               <div className="flex items-center gap-2 text-gray-500 mb-2 text-xs uppercase font-bold"><Terminal size={14}/> Console</div>
               {codeOutput.length === 0 ? <span className="text-gray-600 italic">Run to see output...</span> : codeOutput.map((l, i) => <div key={i} className="whitespace-pre-wrap mb-1">{'> ' + l}</div>)}
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default Interview;