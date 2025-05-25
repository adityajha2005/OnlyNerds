'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMetaMaskStore } from "@/lib/stores/metamask-store";
import { toast } from "sonner";
import { ethers } from 'ethers';
import CreateContestABI from '../../lib/abis/CreateContest.json';

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
}

export default function ContestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const contestId = params.id;
  const { walletAddress, metaMaskIsConnected, initializeMetaMask } = useMetaMaskStore();
  const [contest, setContest] = useState<Contest | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);

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
    const fetchContest = async () => {
      try {
        if (!metaMaskIsConnected) return;

        const contract = await getContract();
        const numericContestId = parseInt(contestId);
        
        const contestData = await contract.getContest(numericContestId);
        const participated = await contract.hasParticipated(numericContestId, walletAddress);
        
        if (participated) {
          const userScore = await contract.getParticipantScore(numericContestId, walletAddress);
          setScore(Number(userScore));
        }
        
        setHasParticipated(participated);
        setContest({
          contestId: numericContestId,
          contestName: contestData.contestName,
          contestType: contestData.contestType,
          questions: contestData.questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: Number(q.correctOptionIndex)
          })),
          isActive: contestData.isActive
        });
        
        setSelectedAnswers(new Array(contestData.questions.length).fill(-1));
      } catch (error: any) {
        console.error('Error fetching contest:', error);
        toast.error('Failed to load contest');
        router.push('/contests');
      }
    };

    fetchContest();
  }, [contestId, metaMaskIsConnected, walletAddress]);

  const handleSubmit = async () => {
    try {
      if (!contest) return;
      
      // Check if all questions are answered
      if (selectedAnswers.some(answer => answer === -1)) {
        toast.error('Please answer all questions');
        return;
      }

      setIsSubmitting(true);
      const contract = await getContract();

      // Submit answers
      const tx = await contract.submitAnswers(contest.contestId, selectedAnswers);
      toast.success('Answers submitted! Please wait for confirmation...');
      
      await tx.wait();
      
      // Get the score and correct answers
      const newScore = await contract.getParticipantScore(contest.contestId, walletAddress);
      setScore(Number(newScore));
      setHasParticipated(true);
      
      // Store correct answers for display
      const correctAns = contest.questions.map(q => q.correctOptionIndex);
      setCorrectAnswers(correctAns);
      setShowResults(true);
      
      toast.success('Answers submitted successfully!');
      
      // Route to contests page after 3 seconds
      setTimeout(() => {
        router.push('/contests');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting answers:', error);
      if (error.message.includes('User rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error(error.message || 'Failed to submit answers');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early return if not connected
  if (!metaMaskIsConnected || !walletAddress) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Navbar />
          <div className="max-w-7xl mx-auto">
            <Card className="mt-[60px] bg-black border border-white/20">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">
                  Connect Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-white/60 mb-6">
                    Please connect your MetaMask wallet to participate in contests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Navbar />
          <div className="max-w-7xl mx-auto">
            <Card className="mt-[60px] bg-black border border-white/20">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">
                  Loading Contest...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-white/60">Please wait while we load the contest...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        <div className="max-w-7xl mx-auto">
          <Card className="mt-[60px] bg-black border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold text-white">
                  {contest.contestName}
                </CardTitle>
                {hasParticipated && score !== null && (
                  <div className="text-xl font-semibold">
                    Score: {score}/{contest.questions.length}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {!contest.isActive ? (
                <div className="text-center py-8">
                  <p className="text-white/60">This contest has ended.</p>
                </div>
              ) : hasParticipated ? (
                <div className="text-center py-8">
                  <p className={`text-xl font-semibold mb-4 ${score === contest.questions.length ? 'text-green-500' : 'text-red-500'}`}>
                    {score === contest.questions.length ? 
                      '🎉 Perfect Score! All answers correct!' : 
                      `You got ${score} out of ${contest.questions.length} questions correct`}
                  </p>
                  <p className="text-white/60">Redirecting to contests page...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {contest.questions.map((question, qIndex) => (
                    <div key={qIndex} className="p-6 border border-white/20 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">
                        {qIndex + 1}. {question.questionText}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <button
                            key={oIndex}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                              showResults ? 
                                correctAnswers[qIndex] === oIndex ?
                                  'bg-green-500/10 text-green-500 border-green-500' :
                                  selectedAnswers[qIndex] === oIndex ?
                                    'bg-red-500/10 text-red-500 border-red-500' :
                                    'bg-black text-white/60 border-white/20' :
                              selectedAnswers[qIndex] === oIndex ?
                                'bg-white text-black border-white' :
                                'bg-black text-white border-white/20 hover:border-white'
                            }`}
                            onClick={() => {
                              if (!showResults) {
                                const newAnswers = [...selectedAnswers];
                                newAnswers[qIndex] = oIndex;
                                setSelectedAnswers(newAnswers);
                              }
                            }}
                            disabled={showResults}
                          >
                            {option}
                            {showResults && (
                              <span className="ml-2">
                                {correctAnswers[qIndex] === oIndex && '✓'}
                                {selectedAnswers[qIndex] === oIndex && correctAnswers[qIndex] !== oIndex && '✗'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || selectedAnswers.some(answer => answer === -1) || showResults}
                      className="bg-black text-white border border-white/20"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}