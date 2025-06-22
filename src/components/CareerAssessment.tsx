import { useState, useRef, useEffect } from 'react';
import { chatAPI, roadmapAPI, type RoadmapListItem } from '../services/api';

// Define types for our form
type Question = {
  id: number;
  text: string;
  answer: string;
  category: string;
};

type RoadmapRecommendation = {
  name: string;
  description: string;
  id: string;
};

type RoadmapResponse = {
  roadmap1: RoadmapRecommendation;
  roadmap2: RoadmapRecommendation;
  roadmap3: RoadmapRecommendation;
  roadmap4: RoadmapRecommendation;
};

const CareerAssessment = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<RoadmapResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<RoadmapListItem[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const firstErrorRef = useRef<HTMLTextAreaElement>(null);
  
  // Load all roadmaps from all pages
  const loadAllRoadmaps = async () => {
    setLoadingRoadmaps(true);
    const allRoadmapsList: RoadmapListItem[] = [];
    
    try {
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await roadmapAPI.getAll(page, 100); // Get 100 items per page
        allRoadmapsList.push(...response.items);
        
        hasMore = response.has_next;
        page++;
      }
      
      setAllRoadmaps(allRoadmapsList);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      // Fallback - try to get at least the first page
      try {
        const response = await roadmapAPI.getAll(1, 100);
        setAllRoadmaps(response.items);
      } catch (fallbackError) {
        console.error('Failed to load any roadmaps:', fallbackError);
        setAllRoadmaps([]);
      }
    } finally {
      setLoadingRoadmaps(false);
    }
  };

  // Load roadmaps on component mount
  useEffect(() => {
    loadAllRoadmaps();
  }, []);
  
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
  const parseRoadmapResponse = (response: string): RoadmapResponse | null => {
    try {
      // Clean the response string
      let cleaned = response.trim();
      
      // Remove any markdown code blocks
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
      cleaned = cleaned.replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');
      
      // Parse JSON
      const parsed = JSON.parse(cleaned);
      return parsed as RoadmapResponse;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return null;
    }
  };
  
  // Handle roadmap card click to navigate to roadmap
  const handleRoadmapClick = (roadmapId: string) => {
    window.open(`/roadmaps/${roadmapId}`, '_blank');
  };

  // Submit to OpenAI
  const submitToOpenAI = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    if (allRoadmaps.length === 0) {
      alert('No roadmaps available. Please try again later.');
      return;
    }
    
    setIsLoading(true);
    
    const formData = questions.reduce((acc, question) => {
      acc[`question_${question.id}`] = question.answer;
      return acc;
    }, {} as Record<string, string>);

    // Create roadmap list for the prompt
    const roadmapList = allRoadmaps.map(roadmap => ({
      id: roadmap._id,
      name: roadmap.name,
      description: roadmap.description
    }));

    const prompt = `
Based on the following career assessment responses from a Computer Science student, recommend 4 specific roadmaps that best match their profile from the available roadmaps. Consider their interests, skills, goals, and awareness level.

Assessment Responses:
${Object.entries(formData).map(([, value], index) => 
  `${index + 1}. ${questions[index]?.text}: ${value}`
).join('\n')}

Available Roadmaps:
${roadmapList.map((roadmap, index) => 
  `${index + 1}. ID: ${roadmap.id}, Name: "${roadmap.name}", Description: "${roadmap.description}"`
).join('\n')}

Please respond with ONLY a JSON object in this exact format (no additional text, no markdown formatting):
{
  "roadmap1": {"name": "Exact Roadmap Name", "description": "Brief explanation of why this roadmap fits their profile (2-3 sentences)", "id": "exact_roadmap_id"},
  "roadmap2": {"name": "Exact Roadmap Name", "description": "Brief explanation of why this roadmap fits their profile (2-3 sentences)", "id": "exact_roadmap_id"},
  "roadmap3": {"name": "Exact Roadmap Name", "description": "Brief explanation of why this roadmap fits their profile (2-3 sentences)", "id": "exact_roadmap_id"},
  "roadmap4": {"name": "Exact Roadmap Name", "description": "Brief explanation of why this roadmap fits their profile (2-3 sentences)", "id": "exact_roadmap_id"}
}

IMPORTANT: 
- Use only the exact roadmap names and IDs from the available roadmaps list above
- Choose 4 different roadmaps that best match the student's profile
- Make sure all IDs are valid and exist in the provided list
`;

    try {
      const response = await chatAPI.chat({ prompt });
      
      const parsedResponse = parseRoadmapResponse(response.response);
      
      if (parsedResponse) {
        // Validate that all recommended roadmap IDs exist
        const validRoadmaps = Object.values(parsedResponse).every(roadmap => 
          allRoadmaps.some(r => r._id === roadmap.id)
        );
        
        if (validRoadmaps) {
          setAiResponse(parsedResponse);
          setCurrentStep(7); // Move to results step
        } else {
          alert('Some recommended roadmaps are not available. Please try again.');
        }
      } else {
        alert('Error parsing AI response. Please try again.');
      }
    } catch (error: any) {
      console.error('Error calling backend chat API:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else if (error.response?.status === 429) {
        alert('API rate limit exceeded. Please try again later.');
      } else if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`);
      } else {
        alert('Error getting recommendations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      } else {
        submitToOpenAI();
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAiResponse(null);
    setValidationErrors([]);
    setQuestions(questions.map(q => ({ ...q, answer: '' })));
  };

  return (
    <div className="min-h-screen bg-black py-8 relative overflow-hidden">
      {/* Background - minimal pulsing lights */}
      <div className="absolute inset-0 opacity-3" style={{ filter: 'blur(2px)' }}>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full animate-pulse-glow" style={{ backgroundColor: '#39FF14', filter: 'blur(60px)' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full animate-pulse-glow delay-1000" style={{ backgroundColor: '#39FF14', filter: 'blur(40px)' }}></div>
      </div>

      {/* Very subtle static grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Career Assessment</h1>
            {currentStep <= 6 && (
              <span className="text-sm text-gray-300">
                Step {currentStep} of {categories.length}
                {loadingRoadmaps && <span className="ml-2 text-yellow-400">(Loading roadmaps...)</span>}
              </span>
            )}
          </div>
          <div className="w-full bg-neutral-800/30 backdrop-blur-sm rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${currentStep > 6 ? 100 : (currentStep / categories.length) * 100}%`,
                backgroundColor: '#39FF14'
              }}
            ></div>
          </div>
        </div>

        {currentStep <= 6 ? (
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md p-6 border border-neutral-700/20">
            <h2 className="text-xl font-semibold text-white mb-6">
              {categories[currentStep - 1]}
            </h2>
            
            <div className="space-y-6">
              {getCurrentCategoryQuestions().map((question) => (
                <div key={question.id} className="space-y-2">
                  <label 
                    htmlFor={`question-${question.id}`}
                    className="block text-sm font-medium text-neutral-200"
                  >
                    {question.text}
                  </label>
                  <textarea
                    id={`question-${question.id}`}
                    data-question-id={question.id}
                    ref={validationErrors.includes(question.id) ? firstErrorRef : null}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 resize-none bg-neutral-800/30 backdrop-blur-sm text-white ${
                      validationErrors.includes(question.id) 
                        ? 'border-red-500 bg-red-900/20 focus:ring-red-400' 
                        : 'border-neutral-600/30 focus:ring-opacity-50'
                    }`}
                    style={!validationErrors.includes(question.id) ? { '--tw-ring-color': '#39FF14' } as React.CSSProperties : {}}
                    rows={3}
                    value={question.answer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Please provide your answer..."
                  />
                  {validationErrors.includes(question.id) && (
                    <p className="text-sm text-red-400">This field is required.</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-neutral-600/30 rounded-md text-neutral-300 hover:bg-neutral-800/30 disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-700/40 backdrop-blur-sm"
              >
                Previous
              </button>
              
              <button
                onClick={goToNextStep}
                disabled={isLoading || loadingRoadmaps}
                className="px-6 py-2 text-black rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                style={{ backgroundColor: '#39FF14' }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Analyzing...</span>
                  </>
                ) : loadingRoadmaps ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{currentStep === 6 ? 'Get Recommendations' : 'Next'}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg shadow-md p-6 border border-neutral-700/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Your Roadmap Recommendations
              </h2>
              <p className="text-neutral-300">
                Based on your responses, here are 4 career roadmaps that might be perfect for you:
              </p>
            </div>

            {aiResponse && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(aiResponse).map(([key, roadmap]) => (
                  <div 
                    key={key}
                    onClick={() => handleRoadmapClick(roadmap.id)}
                    className="border border-neutral-600/30 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer bg-neutral-800/40 backdrop-blur-sm hover:border-opacity-80"
                    style={{ borderColor: '#39FF14', borderWidth: '1px' }}
                  >
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#39FF14' }}>
                      {roadmap.name}
                    </h3>
                    <p className="text-neutral-300 text-sm leading-relaxed">
                      {roadmap.description}
                    </p>
                    <div className="mt-4 text-xs font-medium" style={{ color: '#39FF14' }}>
                      Click to view roadmap →
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-neutral-700/40 backdrop-blur-sm text-white rounded-md hover:bg-neutral-600/40 border border-neutral-600/30"
              >
                Take Assessment Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerAssessment; 