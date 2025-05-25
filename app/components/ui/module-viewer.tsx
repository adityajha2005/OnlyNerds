'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { MCQAssessment } from '@/components/ui/mcq-assessment';
import { getModulesByCourseId } from '@/lib/actions/module.actions';

interface MCQQuestion {
  question: string;
  options: string[];
  correctOption: number;
}

interface Assessment {
  _id: string;
  module_id: string;
  course_id: string;
  type: 'mcq';
  questions: MCQQuestion[];
  createdAt: string;
  updatedAt: string;
}

interface Module {
  _id: string;
  course_id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  createdAt: string;
  updatedAt: string;
}

interface ModuleViewerProps {
  courseId: string;
}

export function ModuleViewer({ courseId }: ModuleViewerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [assessments, setAssessments] = useState<{ [key: string]: Assessment | null }>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedModules = await getModulesByCourseId(courseId);
        
        // Sort modules by index
        const sortedModules = [...fetchedModules].sort((a, b) => a.index - b.index);
        setModules(sortedModules);

        // Fetch assessments for each module
        const assessmentPromises = sortedModules.map(module => 
          fetch(`/api/assessments/${module._id}`).then(res => res.json())
        );
        const fetchedAssessments = await Promise.all(assessmentPromises);
        
        // Create a map of module ID to assessment
        const assessmentMap = sortedModules.reduce((acc, module, index) => ({
          ...acc,
          [module._id]: fetchedAssessments[index]
        }), {});
        
        setAssessments(assessmentMap);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setError('Failed to load modules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchModules();
    }
  }, [courseId]);

  const handleSaveAssessment = async (moduleId: string, questions: MCQQuestion[]) => {
    try {
      console.log('Saving assessment for module:', moduleId);
      console.log('Questions to save:', questions);

      const response = await fetch(`/api/assessments/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          course_id: courseId,
          questions
        })
      });

      const result = await response.json();
      console.log('Save assessment response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save assessment');
      }

      if (result.success) {
        // Update local state
        setAssessments(prev => ({
          ...prev,
          [moduleId]: result.assessment
        }));
        console.log('Assessment saved successfully');
      } else {
        throw new Error(result.message || 'Failed to save assessment');
      }
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      // You might want to show an error message to the user here
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  if (loading) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading modules...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!modules.length) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="text-white/60 text-center">No modules available for this course.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Course Modules</h2>
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module._id}
              className="border border-white/10 rounded-lg overflow-hidden"
            >
              {/* Module Header */}
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center p-4 text-white hover:bg-white/5"
                onClick={() => toggleModule(module._id)}
              >
                <span className="font-medium">{module.name}</span>
                {expandedModule === module._id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>

              {/* Module Content */}
              {expandedModule === module._id && (
                <div className="p-4 border-t border-white/10">
                  {/* Module Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="text-white whitespace-pre-wrap">
                      <ReactMarkdown>{module.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Module Media */}
                  {module.media && module.media.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {module.media.map((url, index) => (
                        <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`Media ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Module Assessment */}
                  <div className="mt-6">
                    <MCQAssessment
                      moduleId={module._id}
                      questions={assessments[module._id]?.questions || []}
                      onSave={(questions: MCQQuestion[]) => handleSaveAssessment(module._id, questions)}
                      isCreator={false}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 