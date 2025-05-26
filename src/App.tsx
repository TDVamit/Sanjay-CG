import { useState, useRef } from 'react';
import axios from 'axios';
import PDFViewer from './components/PDFViewer';

// Define types for our form
type Question = {
  id: number;
  text: string;
  answer: string;
  category: string;
};

type JobRecommendation = {
  name: string;
  description: string;
};

type JobResponse = {
  job1: JobRecommendation;
  job2: JobRecommendation;
  job3: JobRecommendation;
  job4: JobRecommendation;
};

// Job to PDF mapping
const jobToPdfMap: Record<string, string> = {
  "AI Engineer": "ai-engineer.pdf",
  "AI and Data Scientist": "mlops.pdf",
  "Android": "android.pdf",
  "Backend": "backend.pdf",
  "Blockchain": "blockchain.pdf",
  "Cyber Security": "cyber-security.pdf",
  "Data Analyst": "data-analyst.pdf",
  "Developer Relations": "devrel.pdf",
  "Devops": "devops.pdf",
  "Engineering Manager": "engineering-manager.pdf",
  "Frontend": "frontend.pdf",
  "Full-Stack": "full-stack.pdf",
  "Game Developer": "game-developer.pdf",
  "iOS": "ios.pdf",
  "MLOps": "mlops.pdf",
  "PostgreSQL": "postgresql-dba.pdf",
  "Product Manager": "product-manager.pdf",
  "QA": "qa.pdf",
  "Software Architect": "software-architect.pdf",
  "Technical Writer": "technical-writer.pdf",
  "UX Design": "ux-design.pdf"
};

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<JobResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; jobName: string } | null>(null);
  const firstErrorRef = useRef<HTMLTextAreaElement>(null);
  
  // Group questions by category
  const categories = [
    "Self-Assessment & Interests",
    "Career Goals & Awareness",
    "Academic & Skill Evaluation",
    "Practical Exposure",
    "Future Planning & Upskilling",
    "Industry Trends & Awareness"
  ];
  
  // All questions with their categories
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "What excites you most about Computer Science?", answer: "", category: "Self-Assessment & Interests" },
    { id: 2, text: "Which CS subjects do you enjoy the most (e.g., programming, databases, AI, cybersecurity)?", answer: "", category: "Self-Assessment & Interests" },
    { id: 3, text: "Are you more interested in theory (algorithms, math) or application (software development, web dev)?", answer: "", category: "Self-Assessment & Interests" },
    { id: 4, text: "Do you enjoy solving problems and logical puzzles?", answer: "", category: "Self-Assessment & Interests" },
    { id: 5, text: "How comfortable are you working independently vs. in a team?", answer: "", category: "Self-Assessment & Interests" },
    
    { id: 6, text: "What career paths do you know of in the field of Computer Science?", answer: "", category: "Career Goals & Awareness" },
    { id: 7, text: "Do you prefer a corporate job, startup culture, freelancing, or research/academia?", answer: "", category: "Career Goals & Awareness" },
    { id: 8, text: "Are you interested in entrepreneurship or starting your own tech company?", answer: "", category: "Career Goals & Awareness" },
    { id: 9, text: "Which companies or industries would you like to work in (e.g., IT, gaming, fintech, healthtech)?", answer: "", category: "Career Goals & Awareness" },
    { id: 10, text: "What is your dream job role (e.g., Data Scientist, Software Engineer, UI/UX Designer, etc.)?", answer: "", category: "Career Goals & Awareness" },
    
    { id: 11, text: "How strong are your programming skills? Which languages do you know?", answer: "", category: "Academic & Skill Evaluation" },
    { id: 12, text: "Have you done any personal or academic projects? What were they?", answer: "", category: "Academic & Skill Evaluation" },
    { id: 13, text: "Are you comfortable with algorithms and data structures?", answer: "", category: "Academic & Skill Evaluation" },
    { id: 14, text: "Do you have experience with databases, networking, or operating systems?", answer: "", category: "Academic & Skill Evaluation" },
    { id: 15, text: "How good are your soft skills (communication, teamwork, leadership)?", answer: "", category: "Academic & Skill Evaluation" },
    
    { id: 16, text: "Have you done any internships or part-time jobs in tech?", answer: "", category: "Practical Exposure" },
    { id: 17, text: "Do you participate in coding contests or hackathons?", answer: "", category: "Practical Exposure" },
    { id: 18, text: "Are you part of any student clubs, tech communities, or open-source projects?", answer: "", category: "Practical Exposure" },
    { id: 19, text: "Have you built a portfolio, GitHub profile, or personal website?", answer: "", category: "Practical Exposure" },
    { id: 20, text: "Have you published any apps, websites, or research papers?", answer: "", category: "Practical Exposure" },
    
    { id: 21, text: "Are you planning for higher studies (MS, MTech, MBA)?", answer: "", category: "Future Planning & Upskilling" },
    { id: 22, text: "Are you preparing for competitive exams (e.g., GATE, GRE)?", answer: "", category: "Future Planning & Upskilling" },
    { id: 23, text: "Do you know which certifications or online courses are valuable in your desired field?", answer: "", category: "Future Planning & Upskilling" },
    { id: 24, text: "What are your short-term and long-term goals?", answer: "", category: "Future Planning & Upskilling" },
    { id: 25, text: "What steps are you currently taking to achieve your goals?", answer: "", category: "Future Planning & Upskilling" },
    
    { id: 26, text: "Are you aware of emerging fields like AI, ML, Blockchain, IoT, Cloud, and Cybersecurity?", answer: "", category: "Industry Trends & Awareness" },
    { id: 27, text: "Which tech trends do you find interesting?", answer: "", category: "Industry Trends & Awareness" },
    { id: 28, text: "How often do you follow tech news, blogs, podcasts, or influencers?", answer: "", category: "Industry Trends & Awareness" },
    { id: 29, text: "Do you understand the job market demand for different CS specializations?", answer: "", category: "Industry Trends & Awareness" },
    { id: 30, text: "Have you explored remote work or global job opportunities?", answer: "", category: "Industry Trends & Awareness" }
  ]);
  
  // Handler for input changes
  const handleAnswerChange = (id: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, answer: value } : q
    ));
    
    // Remove validation error when user starts typing
    if (value.trim() && validationErrors.includes(id)) {
      setValidationErrors(validationErrors.filter(errorId => errorId !== id));
    }
  };
  
  // Get current category questions
  const getCurrentCategoryQuestions = () => {
    const category = categories[currentStep - 1];
    return questions.filter(q => q.category === category);
  };
  
  // Validate current step questions
  const validateCurrentStep = () => {
    const currentQuestions = getCurrentCategoryQuestions();
    const unansweredQuestions = currentQuestions.filter(q => !q.answer.trim()).map(q => q.id);
    
    if (unansweredQuestions.length > 0) {
      setValidationErrors(unansweredQuestions);
      // Focus on first unanswered question
      setTimeout(() => {
        const firstErrorElement = document.querySelector(`[data-question-id="${unansweredQuestions[0]}"]`) as HTMLTextAreaElement;
        if (firstErrorElement) {
          firstErrorElement.focus();
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return false;
    }
    
    setValidationErrors([]);
    return true;
  };
  
  // Parse JSON response from OpenAI
  const parseJobResponse = (response: string): JobResponse | null => {
    try {
      // Clean the response string
      let cleaned = response.trim();
      
      // Remove any markdown code blocks
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
      cleaned = cleaned.replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');
      
      // Parse JSON
      const parsed = JSON.parse(cleaned);
      return parsed as JobResponse;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return null;
    }
  };
  
  // Handle job card click to open PDF
  const handleJobClick = (jobName: string) => {
    const pdfFileName = jobToPdfMap[jobName];
    if (pdfFileName) {
      const pdfUrl = `/pdfs/${pdfFileName}`;
      setSelectedPdf({ url: pdfUrl, jobName });
    }
  };
  
  // Close PDF viewer
  const closePdfViewer = () => {
    setSelectedPdf(null);
  };
  
  // Submit answers to OpenAI
  const submitToOpenAI = async () => {
    // Validate all questions before submitting
    const allUnansweredQuestions = questions.filter(q => !q.answer.trim()).map(q => q.id);
    if (allUnansweredQuestions.length > 0) {
      setValidationErrors(allUnansweredQuestions);
      // Go to the first step with unanswered questions
      const firstUnansweredQuestion = questions.find(q => allUnansweredQuestions.includes(q.id));
      if (firstUnansweredQuestion) {
        const stepIndex = categories.findIndex(cat => cat === firstUnansweredQuestion.category);
        setCurrentStep(stepIndex + 1);
        setTimeout(() => {
          const firstErrorElement = document.querySelector(`[data-question-id="${firstUnansweredQuestion.id}"]`) as HTMLTextAreaElement;
          if (firstErrorElement) {
            firstErrorElement.focus();
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format questions and answers for OpenAI
      const formattedQuestions = questions.map(q => 
        `${q.id}. ${q.text}\nAnswer: ${q.answer || "Not answered"}`
      ).join('\n\n');
      
      const prompt = `Suggest me best 4 job suitable for me Here are my responses to a career counseling questionnaire:
      
${formattedQuestions}

Based on my responses, please provide comprehensive career guidance, suggesting specific CS career paths that match my interests, skills, and goals. Include advice on skills to develop, courses to take, and potential career trajectories.`;
      
      console.log(prompt);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful computer science career counselor.' },
            { role: 'user', content: prompt + "response should be strictly in json format like this {job1: {name: string, description: string}, job2: {name: string, description: string}, job3: {name: string, description: string}, job4: {name: string, description: string}} you can only choose career options from the list [AI Engineer, AI and Data Scientist, Android, Backend, Blockchain, Cyber Security, Data Analyst, Developer Relations, Devops, Engineering Manager, Frontend, Full-Stack, Game Developer, iOS, MLOps, PostgreSQL, Product Manager, QA, Software Architect, Technical Writer, UX Design]" }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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'
          }
        }
      );
      
      const parsedResponse = parseJobResponse(response.data.choices[0].message.content);
      setAiResponse(parsedResponse);
    } catch (error) {
      console.error('Error submitting to OpenAI:', error);
      setAiResponse(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < categories.length) {
      if (validateCurrentStep()) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      submitToOpenAI();
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]); // Clear validation errors when going back
    }
  };
  
  // Reset form and responses
  const resetForm = () => {
    setQuestions(questions.map(q => ({ ...q, answer: "" })));
    setCurrentStep(1);
    setAiResponse(null);
    setValidationErrors([]);
    setSelectedPdf(null);
  };
  
  // Render response or form based on state
  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden border border-gray-800">
          <div className="bg-gradient-to-r from-gray-900 to-black px-8 py-8 relative border-b border-gray-800">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
            <div className="flex items-center space-x-4">
              <img src="/main-logo.png" alt="SCG Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">CS Career Compass</h1>
                <p className="text-gray-300 mt-1.5 font-light">Get personalized guidance for your CS career path</p>
              </div>
            </div>
          </div>
          
          {aiResponse ? (
            <div className="p-10 bg-gray-900">
              <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Your Career Recommendations
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {Object.entries(aiResponse).map(([key, job], index) => (
                  <div 
                    key={key} 
                    onClick={() => handleJobClick(job.name)}
                    className="bg-black rounded-2xl p-6 border border-gray-700 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-black font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">{job.name}</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-gray-400 group-hover:text-cyan-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-3">{job.description}</p>
                    <div className="flex items-center text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Click to view career guide
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={resetForm}
                  className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start New Assessment
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-900">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-cyan-400 mb-8"></div>
              <p className="text-cyan-400 font-medium text-lg">Generating your personalized career guidance...</p>
            </div>
          ) : (
            <div className="p-10 bg-gray-900">
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-white flex items-center">
                    {currentStep === 1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {currentStep === 2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {currentStep === 3 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {currentStep === 4 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {currentStep === 5 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {currentStep === 6 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {categories[currentStep - 1]}
                  </h2>
                  <span className="text-sm text-gray-400 bg-gray-800 px-5 py-2 rounded-full font-medium border border-gray-700">
                    Step {currentStep} of {categories.length}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${(currentStep / categories.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-300 font-medium">
                      Please answer all required questions before proceeding.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-7">
                {getCurrentCategoryQuestions().map((question) => {
                  const hasError = validationErrors.includes(question.id);
                  return (
                    <div key={question.id} className={`bg-black rounded-2xl p-7 border transition-all duration-300 ${
                      hasError 
                        ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                        : 'border-gray-700 shadow-[0_0_10px_rgba(0,255,255,0.1)] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]'
                    }`}>
                      <label className="block text-white font-medium mb-4 text-lg flex">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-semibold text-sm ${
                          hasError 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                            : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black'
                        }`}>
                          {question.id}
                        </span>
                        <span className={hasError ? 'text-red-300' : 'text-white'}>
                          {question.text}
                          <span className="text-red-400 ml-1">*</span>
                        </span>
                      </label>
                      <textarea
                        ref={hasError && validationErrors[0] === question.id ? firstErrorRef : null}
                        data-question-id={question.id}
                        value={question.answer}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className={`w-full border focus:ring-2 rounded-xl shadow-sm p-5 text-white bg-gray-800 resize-none transition-all duration-200 ${
                          hasError 
                            ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/30' 
                            : 'border-gray-600 focus:border-cyan-400 focus:ring-cyan-400/30'
                        }`}
                        rows={3}
                        placeholder={hasError ? "This field is required..." : "Your answer..."}
                      />
                      {hasError && (
                        <p className="mt-2 text-sm text-red-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          This field is required
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between mt-12">
                <button
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className={`flex items-center py-3.5 px-8 rounded-xl font-medium transition-all duration-200 ${currentStep === 1 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 shadow-[0_0_10px_rgba(75,85,99,0.3)] hover:shadow-[0_0_20px_rgba(75,85,99,0.5)]'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <button
                  onClick={goToNextStep}
                  className="flex items-center bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {currentStep === categories.length ? (
                    <>
                      <span>Submit for Guidance</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Your responses are analyzed by AI to provide personalized career guidance</p>
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PDFViewer
          pdfUrl={selectedPdf.url}
          jobName={selectedPdf.jobName}
          onClose={closePdfViewer}
        />
      )}
    </div>
  );
}

export default App; 