'use client';

import { useState, useEffect } from 'react';
import { CourseWithRanking, CourseRanking, Category, Difficulty } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowBigUp, ArrowBigDown, Wallet } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface VoteRecord {
  courseId: string;
  type: 'up' | 'down';
}

interface CourseListProps {
  initialCourses: CourseWithRanking[];
}

export default function CourseList({ initialCourses }: CourseListProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [account, setAccount] = useState<string | null>(null);
  const [votedRecords, setVotedRecords] = useState<VoteRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkIfWalletIsConnected();
    // Load voted records from localStorage
    const savedVotes = localStorage.getItem('courseVotes');
    if (savedVotes) {
      setVotedRecords(JSON.parse(savedVotes));
    }
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to vote on courses",
          variant: "destructive"
        });
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to vote on courses",
          variant: "destructive"
        });
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const hasVoted = (courseId: string) => {
    return votedRecords.some(record => record.courseId === courseId);
  };

  const getVoteType = (courseId: string): 'up' | 'down' | null => {
    const record = votedRecords.find(record => record.courseId === courseId);
    return record ? record.type : null;
  };

  const handleVote = async (courseId: string, voteType: 'up' | 'down') => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        action: <Button onClick={connectWallet}>Connect Wallet</Button>
      });
      return;
    }

    if (hasVoted(courseId)) {
      toast({
        title: "Already voted",
        description: "You have already voted on this course",
        variant: "destructive"
      });
      return;
    }

    try {
      const { ethereum } = window as any;
      const message = `I want to ${voteType}vote course ${courseId}`;
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      // Save vote record
      const newVoteRecord: VoteRecord = { courseId, type: voteType };
      const updatedVoteRecords = [...votedRecords, newVoteRecord];
      setVotedRecords(updatedVoteRecords);
      localStorage.setItem('courseVotes', JSON.stringify(updatedVoteRecords));

      // Update the UI optimistically
      setCourses(prevCourses =>
        prevCourses.map(course => {
          if (course._id === courseId) {
            const currentRanking = course.ranking || {
              _id: `${courseId}_ranking`,
              creator_id: account,
              upvotes: 0,
              downvotes: 0,
              eloScore: 1000,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const newRanking: CourseRanking = {
              ...currentRanking,
              upvotes: voteType === 'up' ? (currentRanking.upvotes || 0) + 1 : currentRanking.upvotes || 0,
              downvotes: voteType === 'down' ? (currentRanking.downvotes || 0) + 1 : currentRanking.downvotes || 0,
              eloScore: 1000 + ((currentRanking.upvotes || 0) - (currentRanking.downvotes || 0)),
              updatedAt: new Date()
            };
            
            return { ...course, ranking: newRanking };
          }
          return course;
        })
      );

      toast({
        title: "Vote recorded",
        description: `Successfully ${voteType}voted the course`,
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch(difficulty) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-500';
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Advanced':
        return 'bg-red-500/20 text-red-500';
    }
  };

  const getCategoryColor = (category: Category) => {
    switch(category) {
      case 'Web3':
        return 'bg-purple-500/20 text-purple-500';
      case 'AI/ML':
        return 'bg-blue-500/20 text-blue-500';
      case 'Full Stack Development':
        return 'bg-orange-500/20 text-orange-500';
      case 'Marketing':
        return 'bg-pink-500/20 text-pink-500';
      case 'Designs':
        return 'bg-teal-500/20 text-teal-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Community Hub</h1>
          <p className="text-white/60">Discover and vote on the best tech courses</p>
        </div>
        {!account ? (
          <Button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/5 text-white">
              {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => {
          const userVoteType = getVoteType(course._id);
          return (
            <div
              key={course._id}
              className="group relative rounded-xl border border-white/10 hover:border-white/20 transition-all overflow-hidden bg-gradient-to-b from-white/5 to-white/[0.02]"
            >
              <Link href={`/courses/${course._id}`} className="block">
                {/* Course Background Image */}
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={course.background || '/default-course-bg.jpg'}
                    alt={course.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />
                  
                  {/* Difficulty Badge */}
                  <Badge 
                    className={`${getDifficultyColor(course.difficulty)} absolute top-4 right-4 px-3 py-1 text-xs font-medium backdrop-blur-md`}
                  >
                    {course.difficulty}
                  </Badge>

                  {/* Course Rating Overlay */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="text-white/80 text-sm font-medium">
                      {(course.ranking?.upvotes || 0) - (course.ranking?.downvotes || 0)}
                    </span>
                    <div className="h-4 w-px bg-white/20" />
                    <span className="text-white/60 text-xs">rating</span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {course.categories.map((category) => (
                      <Badge 
                        key={category} 
                        className={`${getCategoryColor(category)} text-xs px-2.5`}
                        variant="secondary"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {course.name}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>

                  {/* Voting Section */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVote(course._id, 'up');
                      }}
                      disabled={hasVoted(course._id)}
                      className={cn(
                        "hover:bg-green-500/10 hover:text-green-400 h-9 w-9 p-0 rounded-full",
                        userVoteType === 'up' ? "bg-green-500/20 text-green-400 ring-2 ring-green-500/20" : "text-white/70"
                      )}
                    >
                      <ArrowBigUp className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVote(course._id, 'down');
                      }}
                      disabled={hasVoted(course._id)}
                      className={cn(
                        "hover:bg-red-500/10 hover:text-red-400 h-9 w-9 p-0 rounded-full",
                        userVoteType === 'down' ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/20" : "text-white/70"
                      )}
                    >
                      <ArrowBigDown className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}