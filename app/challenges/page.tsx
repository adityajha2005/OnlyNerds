'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMetaMaskStore } from "@/lib/stores/metamask-store";
import { toast } from "sonner";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

// Your contract address here
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CHALLENGE_CONTRACT_ADDRESS || '';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Challenge {
  _id: string;
  name: string;
  creator_id: string;
  questions: Question[];
  completed?: boolean;
  signature?: string;
}

function ChallengeContent() {
  const searchParams = useSearchParams();
  const { walletAddress, metaMaskIsConnected } = useMetaMaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: 'mcq',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '' }] as Question[]
  });

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        setCurrentPage(page);

        const response = await fetch(`/api/challenges?page=${page}`);
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const result = await response.json();
        
        if (result.success) {
          setChallenges(result.data.challenges);
          setTotalPages(result.data.totalPages);
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error('Error fetching challenges:', error);
        toast.error(error.message);
      }
    };

    fetchChallenges();
  }, [searchParams]);

  // Early return if not connected
  if (!metaMaskIsConnected || !walletAddress) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Navbar />
          <div className="max-w-7xl mx-auto">
            <Card className="mt-[60px] bg-black border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold text-white">
                    Challenges
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
                  <p className="text-white/60 mb-6">
                    Please connect your MetaMask wallet to create or take challenges.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!walletAddress) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Validate questions
      const invalidQuestions = formData.questions.some(q => 
        !q.question || 
        q.options.some(opt => !opt) || 
        !q.correctAnswer
      );

      if (invalidQuestions) {
        toast.error('Please fill in all questions, options, and select correct answers');
        setIsLoading(false);
        return;
      }

      // Create message to sign
      const messageToSign = JSON.stringify({
        creator: walletAddress,
        name: formData.name,
        questions: formData.questions,
        timestamp: Date.now()
      });

      try {
        // Request signature from MetaMask
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [messageToSign, walletAddress]
        });

        // Create challenge with signature
        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creator_id: walletAddress,
            name: formData.name,
            questions: formData.questions,
            signature
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create challenge');
        }

        if (data.success) {
          toast.success('Challenge created successfully!');
          setIsOpen(false);
          setFormData({
            name: '',
            type: 'mcq',
            questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '' }]
          });
          window.location.reload();
        }
      } catch (error: any) {
        console.error('Transaction error:', error);
        if (error.message.includes('User rejected')) {
          toast.error('Transaction was rejected');
        } else {
          toast.error(error.message || 'Failed to create challenge');
        }
      }
    } catch (error: any) {
      console.error('Form error:', error);
      toast.error(error.message || 'Failed to process form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: walletAddress
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Challenge deleted successfully!');
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete challenge');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        <div className="max-w-7xl mx-auto">
          <Card className="mt-[60px] bg-black border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-white">
                  Challenges
                </CardTitle>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-black text-white border border-white/20">
                      Create Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black border-white/20 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Challenge</DialogTitle>
                      <DialogDescription className="text-white/60">
                        Create a new MCQ challenge. You will need to sign the transaction.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Challenge Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-black border-white/20 text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white">Questions</Label>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-white/20 bg-black text-white"
                              onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                              disabled={currentQuestionIndex === 0}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-white">
                              Question {currentQuestionIndex + 1} of {formData.questions.length}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-white/20 bg-black text-white"
                              onClick={() => currentQuestionIndex < formData.questions.length - 1 && setCurrentQuestionIndex(currentQuestionIndex + 1)}
                              disabled={currentQuestionIndex === formData.questions.length - 1}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4 mt-4 p-4 border border-white/20">
                            <div>
                              <Label className="text-white">Question {currentQuestionIndex + 1}</Label>
                              <Textarea
                                value={formData.questions[currentQuestionIndex].question}
                                onChange={(e) => {
                                  const newQuestions = [...formData.questions];
                                  newQuestions[currentQuestionIndex].question = e.target.value;
                                  setFormData(prev => ({ ...prev, questions: newQuestions }));
                                }}
                                className="bg-black border-white/20 text-white"
                                placeholder="Enter your question"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-white">Options</Label>
                              {formData.questions[currentQuestionIndex].options.map((option, oIndex) => (
                                <div key={oIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newQuestions = [...formData.questions];
                                      newQuestions[currentQuestionIndex].options[oIndex] = e.target.value;
                                      setFormData(prev => ({ ...prev, questions: newQuestions }));
                                    }}
                                    className="bg-black border-white/20 text-white"
                                    placeholder={`Option ${oIndex + 1}`}
                                    required
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={`border-white/20 ${
                                      formData.questions[currentQuestionIndex].correctAnswer === option
                                        ? 'bg-white text-black'
                                        : 'bg-black text-white'
                                    }`}
                                    onClick={() => {
                                      const newQuestions = [...formData.questions];
                                      newQuestions[currentQuestionIndex].correctAnswer = option;
                                      setFormData(prev => ({ ...prev, questions: newQuestions }));
                                    }}
                                  >
                                    {formData.questions[currentQuestionIndex].correctAnswer === option ? 'Correct' : 'Set Correct'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (formData.questions.length > 1) {
                                const newQuestions = formData.questions.filter((_, i) => i !== currentQuestionIndex);
                                setFormData(prev => ({ ...prev, questions: newQuestions }));
                                if (currentQuestionIndex === formData.questions.length - 1) {
                                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                                }
                              }
                            }}
                            className="border-white/20 bg-black text-white"
                            disabled={formData.questions.length <= 1}
                          >
                            Remove Question
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: '' }]
                              }));
                              setCurrentQuestionIndex(formData.questions.length);
                            }}
                            className="border-white/20 bg-black text-white"
                          >
                            Add Question
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsOpen(false)}
                          className="border-white/20 bg-black text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-black text-white border border-white/20"
                        >
                          {isLoading ? 'Signing...' : 'Sign & Create'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge: Challenge) => (
                  <div
                    key={challenge._id}
                    className="bg-black border border-white/20 p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-semibold text-white">
                          {challenge.name}
                        </h3>
                        <p className="text-white">
                          by {challenge.creator_id.slice(0, 6) + '...' + challenge.creator_id.slice(-4)}
                        </p>
                      </div>
                      {challenge.creator_id === walletAddress && (
                        <Button
                          variant="outline"
                          className="border-white/20 bg-black text-white"
                          onClick={() => handleDelete(challenge._id)}
                        >
                          <Trash2 className="h-5 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className="text-white border border-white/20 px-2 py-1">
                        MCQ Challenge
                      </span>
                      <span className="text-white ml-2">
                        {challenge.questions.length} questions
                      </span>
                    </div>

                    <div className="mt-4">
                      {challenge.completed ? (
                        <span className="text-white border border-white/20 px-2 py-1">
                          Completed
                        </span>
                      ) : (
                        <Link
                          href={`/challenges/${challenge._id}`}
                          className="bg-black text-white border border-white/20 px-4 py-2 inline-block"
                        >
                          Take Challenge
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {challenges.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-white">No challenges found</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/challenges?page=${pageNum}`}
                      className={`px-4 py-2 ${
                        pageNum === currentPage
                          ? "bg-white text-black"
                          : "bg-black text-white border border-white/20"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Navbar />
          <div className="max-w-7xl mx-auto">
            <Card className="mt-[60px] bg-black border border-white/20">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">
                  Loading Challenges...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-white/60">Please wait while we load the challenges...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <ChallengeContent />
    </Suspense>
  );
}
