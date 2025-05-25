'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaPlus, FaTrash } from 'react-icons/fa6';

interface MCQQuestion {
  question: string;
  options: string[];
  correctOption: number;
}

interface MCQAssessmentProps {
  moduleId: string;
  questions: MCQQuestion[];
  onSave: (questions: MCQQuestion[]) => void;
  isCreator: boolean;
}

export function MCQAssessment({ moduleId, questions: initialQuestions, onSave, isCreator }: MCQAssessmentProps) {
  const [questions, setQuestions] = useState<MCQQuestion[]>(initialQuestions || []);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(initialQuestions?.length || 0).fill(-1));
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setQuestions(initialQuestions || []);
    setSelectedAnswers(new Array(initialQuestions?.length || 0).fill(-1));
    setShowResults(false);
  }, [initialQuestions]);

  const handleAddQuestion = () => {
    if (!isCreator) return;
    const newQuestion: MCQQuestion = {
      question: '',
      options: ['', '', '', ''],
      correctOption: 0
    };
    const updatedQuestions = [...questions, newQuestion];
    console.log('Adding new question:', newQuestion);
    console.log('Updated questions:', updatedQuestions);
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!isCreator) return;
    const updatedQuestions = questions.filter((_, i) => i !== index);
    console.log('Deleting question at index:', index);
    console.log('Updated questions:', updatedQuestions);
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleQuestionChange = (index: number, field: keyof MCQQuestion, value: string | number) => {
    if (!isCreator) return;
    const updatedQuestions = [...questions];
    if (field === 'options') {
      return;
    }
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    console.log('Updating question at index:', index);
    console.log('Updated questions:', updatedQuestions);
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    if (!isCreator) return;
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedQuestions[questionIndex].options.map((opt, i) => 
        i === optionIndex ? value : opt
      )
    };
    console.log('Updating option at question index:', questionIndex, 'option index:', optionIndex);
    console.log('Updated questions:', updatedQuestions);
    setQuestions(updatedQuestions);
    onSave(updatedQuestions);
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (isCreator) {
      // For creator, update the correct option
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        correctOption: optionIndex
      };
      console.log('Updating correct option at question index:', questionIndex, 'to option:', optionIndex);
      console.log('Updated questions:', updatedQuestions);
      setQuestions(updatedQuestions);
      onSave(updatedQuestions);
    } else {
      // For students, update their selected answer
      setSelectedAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[questionIndex] = optionIndex;
        return newAnswers;
      });
    }
  };

  const handleSubmitAssessment = () => {
    setShowResults(true);
  };

  const getScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (question.correctOption === selectedAnswers[index] ? 1 : 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">MCQ Assessment</h3>
        {isCreator && (
          <Button
            onClick={handleAddQuestion}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <FaPlus className="mr-2" />
            Add Question
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((question, questionIndex) => (
          <Card
            key={questionIndex}
            className={`bg-black/50 border-white/10 ${
              showResults && !isCreator
                ? selectedAnswers[questionIndex] === question.correctOption
                  ? 'ring-2 ring-green-500'
                  : 'ring-2 ring-red-500'
                : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <Label className="text-white mb-2">Question {questionIndex + 1}</Label>
                    {isCreator ? (
                      <Input
                        value={question.question}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                        placeholder="Enter your question"
                        className="bg-black/50 border-white/20 text-white"
                      />
                    ) : (
                      <p className="text-white">{question.question}</p>
                    )}
                  </div>
                  {isCreator && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(questionIndex)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <FaTrash />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Options</Label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={isCreator ? question.correctOption === optionIndex : selectedAnswers[questionIndex] === optionIndex}
                        onChange={() => handleAnswerSelect(questionIndex, optionIndex)}
                        className="w-4 h-4"
                        disabled={showResults}
                      />
                      {isCreator ? (
                        <Input
                          value={option}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-grow bg-black/50 border-white/20 text-white"
                        />
                      ) : (
                        <span className={`text-white ${
                          showResults && optionIndex === question.correctOption
                            ? 'text-green-500'
                            : showResults && selectedAnswers[questionIndex] === optionIndex
                            ? 'text-red-500'
                            : ''
                        }`}>
                          {option}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isCreator && questions.length > 0 && !showResults && (
        <Button
          onClick={handleSubmitAssessment}
          className="w-full bg-white/10 hover:bg-white/20 text-white"
        >
          Submit Assessment
        </Button>
      )}

      {showResults && (
        <div className="mt-4 p-4 bg-black/30 rounded-lg">
          <p className="text-white text-lg">
            Your Score: {getScore()} out of {questions.length} ({Math.round((getScore() / questions.length) * 100)}%)
          </p>
        </div>
      )}
    </div>
  );
} 