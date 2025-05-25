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
import { ethers } from 'ethers';
import CreateContestABI from '../lib/abis/CreateContest.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Your contract address here
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTEST_CONTRACT_ADDRESS || '';

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

interface Contest {
  contestId: number;
  contestName: string;
  contestType: string;
  questions: Question[];
  isActive: boolean;
  creator?: string;
  hasParticipated?: boolean;
  score?: number;
}

function ContestContent() {
  const searchParams = useSearchParams();
  const { walletAddress, metaMaskIsConnected, initializeMetaMask } = useMetaMaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contests, setContests] = useState<Contest[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }] as Question[]
  });

  useEffect(() => {
    initializeMetaMask();
  }, [initializeMetaMask]);

  const getContract = async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CreateContestABI, signer);
  };

  useEffect(() => {
    const fetchContests = async () => {
      try {
        if (!metaMaskIsConnected) return;

        const contract = await getContract();
        let contestCount = 0;
        const fetchedContests: Contest[] = [];

        // Keep trying to fetch contests until we get an error
        while (true) {
          try {
            const contest = await contract.getContest(contestCount);
            const hasParticipated = await contract.hasParticipated(contestCount, walletAddress);
            let score;
            if (hasParticipated) {
              score = await contract.getParticipantScore(contestCount, walletAddress);
            }

            fetchedContests.push({
              contestId: contestCount,
              contestName: contest.contestName,
              contestType: contest.contestType,
              questions: contest.questions.map((q: any) => ({
                questionText: q.questionText,
                options: q.options,
                correctOptionIndex: Number(q.correctOptionIndex)
              })),
              isActive: contest.isActive,
              hasParticipated,
              score: score ? Number(score) : undefined
            });
            contestCount++;
          } catch (error) {
            break;
          }
        }

        setContests(fetchedContests);
      } catch (error: any) {
        console.error('Error fetching contests:', error);
        toast.error(error.message);
      }
    };

    fetchContests();
  }, [metaMaskIsConnected, walletAddress]);

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
                    Contests
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
                  <p className="text-white/60 mb-6">
                    Please connect your MetaMask wallet to create or participate in contests.
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
      // Validate questions
      const invalidQuestions = formData.questions.some(q => 
        !q.questionText || 
        q.options.some(opt => !opt) || 
        q.correctOptionIndex === undefined
      );

      if (invalidQuestions) {
        toast.error('Please fill in all questions, options, and select correct answers');
        setIsLoading(false);
        return;
      }

      const contract = await getContract();

      // Create contest
      const tx = await contract.createContest(
        formData.name,
        formData.questions
      );

      toast.success('Transaction submitted! Please wait for confirmation...');
      await tx.wait();
      
      toast.success('Contest created successfully!');
      setIsOpen(false);
      setFormData({
        name: '',
        questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.message.includes('User rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error(error.message || 'Failed to create contest');
      }
    } finally {
      setIsLoading(false);
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
                  Contests
                </CardTitle>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-black text-white border border-white/20">
                      Create Contest
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black border-white/20 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Contest</DialogTitle>
                      <DialogDescription className="text-white/60">
                        Create a new MCQ contest. You will need to sign the transaction.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Contest Name</Label>
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
                                value={formData.questions[currentQuestionIndex].questionText}
                                onChange={(e) => {
                                  const newQuestions = [...formData.questions];
                                  newQuestions[currentQuestionIndex].questionText = e.target.value;
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
                                      formData.questions[currentQuestionIndex].correctOptionIndex === oIndex
                                        ? 'bg-white text-black'
                                        : 'bg-black text-white'
                                    }`}
                                    onClick={() => {
                                      const newQuestions = [...formData.questions];
                                      newQuestions[currentQuestionIndex].correctOptionIndex = oIndex;
                                      setFormData(prev => ({ ...prev, questions: newQuestions }));
                                    }}
                                  >
                                    {formData.questions[currentQuestionIndex].correctOptionIndex === oIndex ? 'Correct' : 'Set Correct'}
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
                                questions: [...prev.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]
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
                          {isLoading ? 'Creating...' : 'Create Contest'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contests.map((contest) => (
                  <div
                    key={contest.contestId}
                    className="bg-black border border-white/20 p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-semibold text-white">
                          {contest.contestName}
                        </h3>
                        <p className="text-white">
                          {contest.contestType} Contest
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-white border border-white/20 px-2 py-1">
                          {contest.questions.length} questions
                        </span>
                        {contest.hasParticipated && contest.score !== undefined && (
                          <>
                            <span className={`px-2 py-1 border ${contest.score === contest.questions.length ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                              Score: {contest.score}/{contest.questions.length}
                            </span>
                            {contest.score !== contest.questions.length && (
                              <span className="text-red-500 border border-red-500 px-2 py-1">
                                {contest.questions.length - contest.score} Wrong
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div>
                        {!contest.isActive ? (
                          <span className="text-white/60 border border-white/20 px-2 py-1">
                            Contest Ended
                          </span>
                        ) : contest.hasParticipated && contest.score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-md ${contest.score === contest.questions.length ? 'bg-green-500/10 text-green-500 border border-green-500' : 'bg-red-500/10 text-red-500 border border-red-500'}`}>
                              {contest.score === contest.questions.length ? '✓ Completed Successfully' : '✗ Completed with Errors'}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/contests/${contest.contestId}`}
                            className="bg-black text-white border border-white/20 px-4 py-2 inline-block hover:bg-white/5 transition-colors"
                          >
                            Take Contest
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {contests.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-white">No contests found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ContestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Navbar />
          <div className="max-w-7xl mx-auto">
            <Card className="mt-[60px] bg-black border border-white/20">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">
                  Loading Contests...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-white/60">Please wait while we load the contests...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <ContestContent />
    </Suspense>
  );
}