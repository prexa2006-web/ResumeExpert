import React, { useState, useRef } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function App() {
  // --- Form & File State ---
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('India');
  const [experience, setExperience] = useState('Auto-Detect');
  
  // --- UI State ---
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpMenuOpen, setIsExpMenuOpen] = useState(false);
  const [progress, setProgress] = useState({ active: false, pct: 0, label: '' });
  const [activeTab, setActiveTab] = useState('jobs');
  const fileInputRef = useRef(null);

  // --- Data State ---
  const [cachedResumeText, setCachedResumeText] = useState('');
  const [results, setResults] = useState({
    skills: null,
    jobsData: null,
    roastData: null,
    interviewData: null,
    jdData: null
  });

  // --- JD Matcher State ---
  const [jdText, setJdText] = useState('');
  const [isMatchingJd, setIsMatchingJd] = useState(false);

  // --- Interview Evaluator State ---
  const [evalQ, setEvalQ] = useState('');
  const [evalA, setEvalA] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeInterviewCategory, setActiveInterviewCategory] = useState('behavioral');

  // --- OPTIMIZER / PDF STATES ---
  const [optimizedTextResult, setOptimizedTextResult] = useState("");
  const [optimizedJsonData, setOptimizedJsonData] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // --- Handlers ---
  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setProgress({ active: true, pct: 10, label: 'Starting analysis...' });
    let currentResumeText = cachedResumeText;

    try {
      // Stage 1: Analyze & Jobs
      setProgress({ active: true, pct: 15, label: '📄 Parsing your resume & extracting skills...' });
      const analyzeFd = new FormData();
      analyzeFd.append('file', file);
      analyzeFd.append('target_role', role);
      analyzeFd.append('experience_level', experience);
      analyzeFd.append('location', location);

      const analyzeRes = await fetch('/analyze', { method: 'POST', body: analyzeFd });
      const analyzeData = await analyzeRes.json();
      if (analyzeData.error) throw new Error(analyzeData.error);
      
      currentResumeText = analyzeData.resume_text;
      setCachedResumeText(currentResumeText);
      setResults(prev => ({ ...prev, skills: analyzeData.skills, jobsData: analyzeData }));

      // Stage 2: Roast
      setProgress({ active: true, pct: 55, label: '🔥 Roasting your resume...' });
      const roastFd = new FormData();
      roastFd.append('file', file);
      roastFd.append('target_role', role);
      roastFd.append('experience_level', experience);
      const roastRes = await fetch('/roast', { method: 'POST', body: roastFd });
      const roastData = await roastRes.json();
      setResults(prev => ({ ...prev, roastData }));

      // Stage 3: Interview Prep
      setProgress({ active: true, pct: 85, label: '🎯 Preparing interview questions...' });
      const interviewFd = new FormData();
      interviewFd.append('file', file);
      interviewFd.append('target_role', role);
      interviewFd.append('experience_level', experience);
      const interviewRes = await fetch('/interview-prep', { method: 'POST', body: interviewFd });
      const interviewData = await interviewRes.json();
      setResults(prev => ({ ...prev, interviewData }));

      setProgress({ active: true, pct: 100, label: '✅ All analysis complete!' });
      setTimeout(() => setProgress(p => ({ ...p, active: false })), 1500);

    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
      setProgress({ active: false, pct: 0, label: '' });
    }
  };

  const handleJdMatch = async () => {
    if (!cachedResumeText) return alert("Please upload and analyze a resume first!");
    if (!jdText.trim()) return alert("Please paste a Job Description!");

    setIsMatchingJd(true);
    const fd = new FormData();
    fd.append('resume_text', cachedResumeText);
    fd.append('jd_text', jdText);

    try {
      const res = await fetch('/match-jd', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(prev => ({ ...prev, jdData: data }));
    } catch (err) {
      alert("Match analysis failed.");
    } finally {
      setIsMatchingJd(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!evalQ || !evalA) return alert('Please provide both a question and an answer.');
    
    setIsEvaluating(true);
    const fd = new FormData();
    fd.append('question', evalQ);
    fd.append('user_answer', evalA);
    fd.append('resume_text', cachedResumeText);

    try {
      const res = await fetch('/evaluate-answer', { method: 'POST', body: fd });
      const data = await res.json();
      setEvalResult(data);
    } catch (err) {
      alert("Failed to evaluate answer.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- NEW OPTIMIZER HANDLER (Handles JSON for Om Solanki Template) ---
  const handleOptimize = async (mode) => {
    if (!file) return alert("Please upload a resume first!");
    setIsOptimizing(true);
    setOptimizedJsonData(null);
    setOptimizedTextResult("Generating optimized professional resume format... Please wait.");

    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', mode);
    fd.append('target_role', role);
    
    try {
      const res = await fetch('/optimize-resume', { method: 'POST', body: fd });
      const data = await res.json();
      
      if (data.optimized_text) {
        try {
          const parsedData = JSON.parse(data.optimized_text);
          setOptimizedJsonData(parsedData);
          setOptimizedTextResult(""); // Clear text if JSON is successful
        } catch (parseError) {
          // Fallback to text if AI didn't return proper JSON
          setOptimizedTextResult(data.optimized_text);
        }
      } else {
        setOptimizedTextResult("Error: " + data.error);
      }
    } catch (err) {
      setOptimizedTextResult("Optimization failed! Please check backend console.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // Helper function to safely render links
  const renderLink = (url, label) => {
    if (!url) return null;
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    return (
      <a href={safeUrl} target="_blank" rel="noreferrer" style={{color: '#0066cc', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px'}}>
        🔗 {label}
      </a>
    );
  };

  return (
    <div className="container" onClick={() => setIsExpMenuOpen(false)}>
      
      {/* FIXED PRINT CSS: Hides everything except the printable resume */}
      <style>{`
        @media print {
          body, html { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; background: white !important; }
          #printable-resume-wrapper { display: block !important; width: 100%; margin: 0; padding: 0; }
          #printable-resume { border: none !important; padding: 10px !important; margin: 0 !important; box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <header className="no-print">
        <h1 id="main-title">Smart Resume <span>Analyzer</span></h1>
        <p className="subtitle">AI-powered skill extraction, job matching & interview prep</p>
      </header>

      <main className="no-print">
        {/* --- UPLOAD SECTION --- */}
        <section className="upload-section card">
          <div 
            className={`upload-box ${isDragOver ? 'dragover' : ''}`}
            style={{ opacity: progress.active ? 0.5 : 1, pointerEvents: progress.active ? 'none' : 'auto' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="upload-icon mx-auto" />
            <p>{file ? `Selected: ${file.name}` : 'Drag & drop your PDF resume or click to upload'}</p>
            <input type="file" accept=".pdf" hidden ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files[0])} />
            <button className="btn btn-primary">Choose File</button>
          </div>

          <div className="form-row">
            {/* Custom Experience Dropdown */}
            <div className="form-group" onClick={(e) => e.stopPropagation()}>
              <label>Experience Level</label>
              <div className={`custom-select-wrapper ${isExpMenuOpen ? 'open' : ''}`}>
                <div className="custom-select-trigger" onClick={() => setIsExpMenuOpen(!isExpMenuOpen)}>
                  <span>{experience}</span>
                  <ChevronDown size={18} className="text-primary transition-transform duration-300" style={{ transform: isExpMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}/>
                </div>
                <div className="custom-options">
                  {['Auto-Detect', 'Internship', 'Entry Level / Junior', 'Mid-Level', 'Senior / Lead'].map(level => (
                    <span 
                      key={level} 
                      className={`custom-option ${experience === level ? 'selected' : ''}`} 
                      onClick={() => { setExperience(level); setIsExpMenuOpen(false); }}
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Target Role (Optional)</label>
              <input type="text" className="text-input" placeholder="e.g. Data Scientist" value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" className="text-input" placeholder="e.g. India, Remote" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary btn-analyze w-full" disabled={!file || progress.active} onClick={handleAnalyze}>
            <span>🚀 Analyze My Resume</span>
          </button>

          {progress.active && (
            <div id="progress-container">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress.pct}%` }}></div>
              </div>
              <p className="progress-label">{progress.label}</p>
            </div>
          )}
        </section>

        {/* --- RESULTS SECTION --- */}
        {results.skills && (
          <>
            {/* NEW OPTIMIZER SECTION WITH PDF GENERATOR */}
            <section id="optimizer-section">
              <div className="card mb-4" style={{border: '2px solid #a855f7'}}>
                <h3>✨ Resume AI Editor & PDF Generator</h3>
                <p className="subtitle mt-1 mb-3">AI will rewrite your resume into a clean format with proper GitHub/Portfolio links.</p>
                <div className="flex gap-4">
                  <button className="btn btn-secondary" disabled={isOptimizing} onClick={() => handleOptimize('keep_format')}>
                    {isOptimizing ? 'Generating...' : '1. Polish Words Only'}
                  </button>
                  <button className="btn btn-primary" disabled={isOptimizing} onClick={() => handleOptimize('enhance_content')}>
                    {isOptimizing ? 'Generating...' : '2. Enhance & Add Keywords'}
                  </button>
                </div>

                {/* Plain Text Fallback (In case AI fails to give JSON) */}
                {optimizedTextResult && !optimizedJsonData && (
                  <div className="mt-4 p-4" style={{backgroundColor: '#1e1e2d', borderRadius: '8px'}}>
                    <div className="flex justify-between items-center mb-3">
                        <h4 style={{margin: 0}}>Generated Text Result:</h4>
                        <button className="btn btn-secondary" style={{padding: '5px 12px', fontSize: '12px'}} 
                          onClick={() => {navigator.clipboard.writeText(optimizedTextResult); alert('Copied to clipboard!');}}>
                          Copy Text
                        </button>
                    </div>
                    <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6'}}>
                      {optimizedTextResult}
                    </pre>
                  </div>
                )}
              </div>
            </section>

            <section id="skills-section">
              <div className="card">
                <h3>🛠️ Extracted Skills</h3>
                <div className="tags">
                  {results.skills.map((s, i) => <span key={i} className="tag">{s}</span>)}
                </div>
              </div>
            </section>
          </>
        )}

        {results.jobsData && (
          <div id="tabs-container">
            <div className="tabs">
              {['jobs', 'roast', 'jd-match', 'interview'].map(tab => (
                <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'jobs' ? '💼 Job Matches' : tab === 'roast' ? '📝 Analysis' : tab === 'jd-match' ? '🎯 JD Matcher' : '🎯 Interview'}
                </button>
              ))}
            </div>

            {/* TAB: JOBS */}
            {activeTab === 'jobs' && (
              <div className="tab-panel active">
                <div className="card">
                  <h3>💼 AI-Matched Job Listings</h3>
                  <p className="subtitle mb-4">Real jobs scored against your resume.</p>
                  <div className="jobs-grid">
                    {results.jobsData.jobs?.map((job, i) => (
                      <div key={i} className="job-card">
                        <div className="job-card-header">
                          <div>
                            <h4 className="job-title">{job.title}</h4>
                            <p className="job-meta">🏢 {job.company} • 📍 {job.location}</p>
                          </div>
                          <span className="source-badge" style={{background: '#6366f1'}}>{job.source}</span>
                        </div>
                        <div className="score-section">
                          <div className="score-label"><span>Match Score</span><span className="score-value" style={{color: job.score >= 75 ? '#10b981' : '#f59e0b'}}>{job.score}%</span></div>
                          <div className="score-bar-track"><div className="score-bar-fill" style={{width: `${job.score}%`, background: job.score >= 75 ? '#10b981' : '#f59e0b'}}></div></div>
                        </div>
                        <a href={job.link || job.url} target="_blank" rel="noreferrer" className="apply-btn">Apply Now →</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROAST (WITH RADAR CHART) */}
            {activeTab === 'roast' && results.roastData && (
              <div className="tab-panel active">
                
                <div className="card">
                  <h3 className="text-center mb-4">Resume Dimension Analysis</h3>
                  
                  {/* --- Radar Chart --- */}
                  <div style={{ width: '100%', height: 320 }} className="mb-6">
                    <ResponsiveContainer>
                      <RadarChart 
                        cx="50%" cy="50%" outerRadius="70%" 
                        data={Object.entries(results.roastData.dimension_scores || {}).map(([key, val]) => ({
                          subject: key.replace(/_/g, ' ').toUpperCase(),
                          A: val,
                          fullMark: 100
                        }))}
                      >
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ backgroundColor: '#12121c', borderColor: '#a855f7', borderRadius: '8px' }} itemStyle={{ color: '#ec4899' }}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="score-circle-wrap mt-2">
                    <h3 className="mb-2">Overall Score</h3>
                    <div className="score-circle mx-auto" style={{borderColor: '#10b981', color: '#10b981'}}>{results.roastData.overall_score}</div>
                  </div>
                  
                  <div className="roast-callout mt-6"><p>🔥 {results.roastData.roast}</p></div>
                </div>

                {/* --- Strengths --- */}
                {results.roastData.strengths?.length > 0 && (
                  <div className="card mt-4">
                    <h3>💪 Strengths</h3>
                    <div className="tags mt-3">
                      {results.roastData.strengths.map((s, i) => <span key={i} className="tag tag-green">{s}</span>)}
                    </div>
                  </div>
                )}
                
                {/* --- Weak Bullets --- */}
                {results.roastData.weak_bullets?.length > 0 && (
                  <div className="card mt-4">
                    <h3 className="mb-2">📝 Weak Bullets Rewritten</h3>
                    {results.roastData.weak_bullets.map((b, i) => (
                      <div key={i} className="bullet-comparison">
                        <p className="bullet-original">❌ {b.original}</p>
                        <p className="bullet-rewritten">✅ {b.rewritten}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* --- Missing Sections --- */}
                {results.roastData.missing_sections?.length > 0 && (
                  <div className="card mt-4">
                    <h3>⚠️ Missing Sections</h3>
                    <div className="tags mt-3">
                      {results.roastData.missing_sections.map((s, i) => <span key={i} className="tag tag-yellow">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* --- Cliches Found --- */}
                {results.roastData.cliches_found?.length > 0 && (
                  <div className="card mt-4">
                    <h3>🚫 Clichés Found</h3>
                    <div className="mt-3">
                      {results.roastData.cliches_found.map((c, i) => <span key={i} className="cliche-item">{c}</span>)}
                    </div>
                  </div>
                )}

                {/* --- Tailored Cover Letter --- */}
                {results.roastData.cover_letter && (
                  <div className="card mt-4">
                    <h3>✉️ Tailored Cover Letter</h3>
                    <div className="cover-letter-box">
                      <button 
                        className="copy-btn" 
                        onClick={(e) => {
                          navigator.clipboard.writeText(results.roastData.cover_letter);
                          e.target.textContent = 'Copied!';
                          setTimeout(() => e.target.textContent = 'Copy', 2000);
                        }}
                      >
                        Copy
                      </button>
                      <pre>{results.roastData.cover_letter}</pre>
                    </div>
                  </div>
                )}
                
              </div>
            )}

            {/* TAB: JD MATCH (WITH DONUT CHART) */}
            {activeTab === 'jd-match' && (
              <div className="tab-panel active">
                <div className="card">
                  <h3>🎯 Resume vs. Job Description</h3>
                  <textarea className="text-input mt-2" style={{minHeight: '150px'}} placeholder="Paste JD here..." value={jdText} onChange={e => setJdText(e.target.value)}></textarea>
                  <button className="btn btn-primary mt-4" onClick={handleJdMatch} disabled={isMatchingJd}>{isMatchingJd ? 'Analyzing...' : 'Analyze Match'}</button>
                </div>
                
                {results.jdData && (
                  <>
                    <div className="card mt-4">
                      
                      {/* --- Donut Chart --- */}
                      <div className="flex flex-col items-center justify-center mt-4" style={{ position: 'relative' }}>
                        <h3 className="mb-0">ATS Match Score</h3>
                        <div style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Match', value: results.jdData.ats_score || 0 },
                                  { name: 'Gap', value: 100 - (results.jdData.ats_score || 0) }
                                ]}
                                cx="50%" cy="50%" innerRadius={75} outerRadius={95}
                                stroke="none" dataKey="value" startAngle={90} endAngle={-270}
                                animationDuration={1500}
                              >
                                <Cell fill="#a855f7" style={{ filter: 'drop-shadow(0px 0px 8px rgba(168,85,247,0.6))' }} />
                                <Cell fill="rgba(255,255,255,0.05)" />
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#12121c', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#f1f5f9' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Center Number Overlay */}
                        <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>
                          {results.jdData.ats_score}%
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-6">
                         <div>
                           <h3 className="mb-2">✅ Matched Keywords</h3>
                           <div className="tags">{results.jdData.matched_skills?.map((s,i) => <span key={i} className="tag tag-green">{s}</span>)}</div>
                         </div>
                         <div>
                           <h3 className="mb-2">⚠️ Missing Keywords</h3>
                           <div className="tags">{results.jdData.missing_skills?.map((s,i) => <span key={i} className="tag tag-red">{s}</span>)}</div>
                         </div>
                      </div>
                    </div>
                    
                    {/* --- Culture Fit --- */}
                    {results.jdData.culture_fit_analysis && (
                      <div className="card mt-4">
                        <h3>🏢 Culture & Experience Fit</h3>
                        <p className="markdown-content mt-2">{results.jdData.culture_fit_analysis}</p>
                      </div>
                    )}

                    {/* --- Bullet Suggestions --- */}
                    {results.jdData.bullet_suggestions?.length > 0 && (
                      <div className="card mt-4">
                        <h3>📝 Resume Tailoring Suggestions</h3>
                        <p className="subtitle mb-2">Update these bullets on your resume to increase your ATS score for this specific job.</p>
                        {results.jdData.bullet_suggestions.map((b, i) => (
                          <div key={i} className="bullet-comparison mt-2">
                            <p className="bullet-original">❌ {b.current_bullet}</p>
                            <p className="bullet-rewritten">✅ <strong>Tailored:</strong> {b.tailored_bullet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: INTERVIEW */}
            {activeTab === 'interview' && results.interviewData && (
              <div className="tab-panel active">
                <div className="card">
                   <h3>❓ Question Bank</h3>
                   <div className="toggle-group mt-2">
                     <button className={`toggle-btn ${activeInterviewCategory === 'behavioral' ? 'active' : ''}`} onClick={() => setActiveInterviewCategory('behavioral')}>Behavioral</button>
                     <button className={`toggle-btn ${activeInterviewCategory === 'technical' ? 'active' : ''}`} onClick={() => setActiveInterviewCategory('technical')}>Technical</button>
                   </div>
                   
                   <div className="mt-4">
                     {activeInterviewCategory === 'behavioral' 
                       ? results.interviewData.behavioral_questions?.map((q, i) => (
                           <div key={i} className="q-card"><h4>{q.question}</h4><p className="q-sub">{q.why_asked}</p></div>
                         ))
                       : results.interviewData.technical_questions?.map((q, i) => (
                           <div key={i} className="q-card"><h4>{q.question}</h4><span className="tag mt-2 inline-block">{q.topic}</span></div>
                         ))
                     }
                   </div>
                </div>

                <div className="card mt-4">
                  <h3>🎤 Answer Evaluator</h3>
                  <input type="text" className="text-input mt-2" placeholder="Type a question to answer..." value={evalQ} onChange={e => setEvalQ(e.target.value)} />
                  <textarea className="text-input mt-2" style={{minHeight:'100px'}} placeholder="Your answer..." value={evalA} onChange={e => setEvalA(e.target.value)}></textarea>
                  <button className="btn btn-primary mt-4" onClick={handleEvaluateAnswer} disabled={isEvaluating}>Evaluate</button>
                  
                  {evalResult && (
                    <div className="mt-4">
                      <p className="eval-score" style={{color: '#10b981'}}>{evalResult.score}/10</p>
                      <p className="mt-2 text-muted">{evalResult.feedback}</p>
                      <div className="better-answer-box mt-2"><p><strong>Stronger answer:</strong> {evalResult.better_answer}</p></div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* --- PRINTABLE RESUME WRAPPER --- */}
      {optimizedJsonData && (
        <div id="printable-resume-wrapper" className="mt-4">
          
          <div className="card no-print mb-4" style={{ backgroundColor: '#1e1e2d', border: '1px solid #10b981' }}>
            <div className="flex justify-between items-center">
              <h3 style={{color: '#10b981', margin: 0}}>✅ Resume Ready for Download!</h3>
              <button className="btn btn-success" onClick={handleDownloadPDF} style={{padding: '8px 20px', fontWeight: 'bold'}}>
                📥 Download as PDF
              </button>
            </div>
            <p className="text-muted mt-2 mb-0">Preview your resume below. Click the download button to save it (only the white document will print).</p>
          </div>
          
          {/* THE ACTUAL RESUME LAYOUT */}
          <div id="printable-resume" style={{ 
            padding: '40px', fontFamily: '"Arial", sans-serif', maxWidth: '850px', margin: '0 auto', 
            backgroundColor: '#ffffff', color: '#000000', border: '1px solid #ccc', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #222', paddingBottom: '15px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#111', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                {optimizedJsonData.personal_info?.name || "Your Name"}
              </h1>
              
              <div style={{ fontSize: '15px', color: '#333', marginBottom: '10px' }}>
                {optimizedJsonData.personal_info?.email && <span>✉️ {optimizedJsonData.personal_info.email} &nbsp;|&nbsp; </span>}
                {optimizedJsonData.personal_info?.phone && <span>📞 {optimizedJsonData.personal_info.phone} &nbsp;|&nbsp; </span>}
                {optimizedJsonData.personal_info?.location && <span>📍 {optimizedJsonData.personal_info.location}</span>}
              </div>
              
              {/* Clickable Links Section */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
                {renderLink(optimizedJsonData.personal_info?.linkedin, 'LinkedIn')}
                {renderLink(optimizedJsonData.personal_info?.github, 'GitHub')}
                {renderLink(optimizedJsonData.personal_info?.portfolio, 'Portfolio')}
              </div>
            </div>

            {/* Summary */}
            {optimizedJsonData.summary && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#222', textAlign: 'justify' }}>{optimizedJsonData.summary}</p>
              </div>
            )}

            {/* Education */}
            {optimizedJsonData.education && optimizedJsonData.education.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ backgroundColor: '#f0f0f0', padding: '5px 10px', marginBottom: '15px', fontSize: '16px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Education</h3>
                {optimizedJsonData.education.map((edu, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' }}>
                    <div><strong style={{color: '#000'}}>{edu.degree}</strong> <br/> <span style={{color: '#444', fontStyle: 'italic'}}>{edu.institution}</span></div>
                    <div style={{ textAlign: 'right', color: '#333' }}><strong>{edu.year}</strong> <br/> {edu.score}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {optimizedJsonData.skills && optimizedJsonData.skills.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ backgroundColor: '#f0f0f0', padding: '5px 10px', marginBottom: '15px', fontSize: '16px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</h3>
                {optimizedJsonData.skills.map((skill, idx) => (
                  <div key={idx} style={{ fontSize: '15px', marginBottom: '8px', lineHeight: '1.4' }}>
                    <strong style={{color: '#000'}}>{skill.category}:</strong> <span style={{color: '#333'}}>{skill.items}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {optimizedJsonData.projects && optimizedJsonData.projects.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ backgroundColor: '#f0f0f0', padding: '5px 10px', marginBottom: '15px', fontSize: '16px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</h3>
                {optimizedJsonData.projects.map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: '18px', fontSize: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <strong style={{color: '#000', fontSize: '16px'}}>{proj.name}</strong>
                      {proj.link && <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" style={{color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold'}}>🔗 View Project</a>}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '14px', color: '#555', marginBottom: '8px' }}>Tech Stack: {proj.tech_stack}</div>
                    <p style={{ margin: '0', lineHeight: '1.6', color: '#222', textAlign: 'justify' }}>{proj.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {optimizedJsonData.experience && optimizedJsonData.experience.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ backgroundColor: '#f0f0f0', padding: '5px 10px', marginBottom: '15px', fontSize: '16px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Experience</h3>
                {optimizedJsonData.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: '18px', fontSize: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <strong style={{color: '#000', fontSize: '16px'}}>{exp.role}</strong>
                      <span style={{color: '#333', fontWeight: 'bold'}}>{exp.duration}</span>
                    </div>
                    <div style={{ fontStyle: 'italic', marginBottom: '8px', color: '#555' }}>{exp.company}</div>
                    <p style={{ margin: '0', lineHeight: '1.6', color: '#222', textAlign: 'justify' }}>{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {optimizedJsonData.certifications && optimizedJsonData.certifications.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ backgroundColor: '#f0f0f0', padding: '5px 10px', marginBottom: '15px', fontSize: '16px', color: '#111', textTransform: 'uppercase', letterSpacing: '1px' }}>Certifications & Extra Activities</h3>
                <ul style={{ margin: '0', paddingLeft: '25px', fontSize: '15px', color: '#222', lineHeight: '1.7' }}>
                  {optimizedJsonData.certifications.map((cert, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}

export default App;