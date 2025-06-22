import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roadmapAPI, type RoadmapResponse } from '../services/api';
import RoadmapVisualization from './RoadmapVisualization';

const RoadmapFullscreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load roadmap details
  const loadRoadmap = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await roadmapAPI.getById(id);
      setRoadmap(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [id]);

  // Go back to roadmap detail
  const goBack = () => {
    navigate(`/roadmaps/${id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 text-lg">Loading roadmap...</span>
          </div>
        </div>
      </div>
    );
  };

  // Error state
  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || 'Roadmap not found'}</div>
          <button
            onClick={goBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if roadmap has valid JSON data
  const hasValidRoadmap = (() => {
    try {
      JSON.parse(roadmap.roadmap);
      return true;
    } catch {
      return false;
    }
  })();

  if (!hasValidRoadmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-yellow-800 font-medium text-lg">No Visual Roadmap</span>
            </div>
            <p className="text-yellow-700 mb-4">
              This roadmap doesn't have visual content to display in fullscreen mode.
            </p>
            <button
              onClick={goBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back to Roadmap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-lg font-semibold text-gray-900">{roadmap.name}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Fullscreen View</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Visualization */}
      <div className="pt-16 h-screen">
        <RoadmapVisualization 
          data={roadmap.roadmap}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default RoadmapFullscreen; 