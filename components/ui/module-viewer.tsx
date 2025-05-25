'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { MCQAssessment } from '@/components/ui/mcq-assessment';

interface Module {
  _id: string;
  course_id: string;
  name: string;
  content: string;
  media: string[];
  index: number;
  assessment?: {
    questions: {
      question: string;
      options: string[];
      correctOption: number;
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ModuleViewerProps {
  courseId: string;
}

export function ModuleViewer({ courseId }: ModuleViewerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/modules/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data = await response.json();
      // Sort modules by index
      const sortedModules = data.sort((a: Module, b: Module) => a.index - b.index);
      setModules(sortedModules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setError('Failed to load course modules. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-white/60">Loading modules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-red-400">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-white/60">No modules available for this course.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-white/10">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Course Modules</h2>
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module._id}
              className="border border-white/10 rounded-lg overflow-hidden"
            >
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5"
                onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
              >
                <span className="font-medium">{module.name}</span>
                {expandedModule === module._id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
              
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
                  {module.assessment && module.assessment.questions.length > 0 && (
                    <div className="mt-6">
                      <MCQAssessment
                        moduleId={module._id}
                        questions={module.assessment.questions}
                        onSave={() => {}} // Read-only mode
                        isCreator={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 