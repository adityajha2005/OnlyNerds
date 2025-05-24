'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMetaMaskStore } from "@/lib/stores/metamask-store";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const { walletAddress, metaMaskIsConnected } = useMetaMaskStore();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Early return if not connected
    if (!metaMaskIsConnected || !walletAddress) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="container mx-auto px-4 py-8">
                    <Navbar />
                    <div className="max-w-4xl mx-auto">
                        <Card className="mt-[60px] bg-black border border-white/20">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold text-white">
                                    Connect Your Wallet
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <p className="text-white/60 mb-6">
                                        Please connect your MetaMask wallet to take this challenge.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/challenges')}
                                        className="bg-black text-white border border-white/20"
                                    >
                                        Back to Challenges
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const response = await fetch(`/api/challenges/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch challenge');
                }

                const data = await response.json();
                if (data.success) {
                    setChallenge(data.data);
                    // Initialize selected answers array with empty strings
                    setSelectedAnswers(new Array(data.data.questions.length).fill(''));
                } else {
                    throw new Error(data.error);
                }
            } catch (error: any) {
                console.error('Error fetching challenge:', error);
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchChallenge();
        }
    }, [params.id]);

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setSelectedAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (!challenge || !walletAddress) return;

        // Check if all questions are answered
        if (selectedAnswers.some(answer => !answer)) {
            toast.error('Please answer all questions before submitting');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create message to sign
            const messageToSign = JSON.stringify({
                challenger: walletAddress,
                challengeId: challenge._id,
                answers: selectedAnswers,
                timestamp: Date.now()
            });

            // Request signature from MetaMask
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [messageToSign, walletAddress]
            });

            // Submit answers
            const response = await fetch(`/api/challenges/${challenge._id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challenger_id: walletAddress,
                    answers: selectedAnswers,
                    signature
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit challenge');
            }

            if (data.success) {
                // Calculate score
                const correctAnswers = challenge.questions.map(q => q.correctAnswer);
                const score = selectedAnswers.reduce((acc, answer, index) => 
                    answer === correctAnswers[index] ? acc + 1 : acc, 0
                );
                const percentage = (score / challenge.questions.length) * 100;

                toast.success(`Challenge completed! Score: ${percentage}%`);
                router.push('/challenges');
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            if (error.message.includes('User rejected')) {
                toast.error('Transaction was rejected');
            } else {
                toast.error(error.message || 'Failed to submit challenge');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Challenge not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8">
                <Navbar />
                <div className="max-w-4xl mx-auto">
                    <Card className="mt-[60px] bg-black border border-white/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-white">
                                {challenge.name}
                            </CardTitle>
                            <p className="text-white/60">
                                by {challenge.creator_id.slice(0, 6)}...{challenge.creator_id.slice(-4)}
                            </p>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-8">
                                <div className="flex items-center justify-between mb-4">
                                    <Button
                                        variant="outline"
                                        className="border-white/20 bg-black text-white"
                                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-white">
                                        Question {currentQuestionIndex + 1} of {challenge.questions.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        className="border-white/20 bg-black text-white"
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(challenge.questions.length - 1, prev + 1))}
                                        disabled={currentQuestionIndex === challenge.questions.length - 1}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold">
                                        {challenge.questions[currentQuestionIndex].question}
                                    </h3>

                                    <RadioGroup
                                        value={selectedAnswers[currentQuestionIndex]}
                                        onValueChange={handleAnswerSelect}
                                        className="space-y-4"
                                    >
                                        {challenge.questions[currentQuestionIndex].options.map((option, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <RadioGroupItem
                                                    value={option}
                                                    id={`option-${index}`}
                                                    className="border-white/20"
                                                />
                                                <Label
                                                    htmlFor={`option-${index}`}
                                                    className="text-white cursor-pointer"
                                                >
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="flex justify-between items-center pt-8">
                                    <div className="text-white/60">
                                        {selectedAnswers.filter(Boolean).length} of {challenge.questions.length} questions answered
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || selectedAnswers.some(answer => !answer)}
                                        className="bg-black text-white border border-white/20"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Challenge'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 