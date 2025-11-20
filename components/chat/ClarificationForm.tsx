
import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface ClarificationFormProps {
    questions: string[];
    onSubmit: (answers: string[]) => void;
}

export const ClarificationForm: React.FC<ClarificationFormProps> = ({ questions, onSubmit }) => {
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation: ensure all questions are answered.
        if (answers.every(answer => answer.trim() !== '')) {
            onSubmit(answers);
        } else {
            alert("Please answer all questions before submitting.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-4 mb-4 p-4 rounded-lg bg-black/20 border border-white/10 space-y-4">
            {questions.map((q, index) => (
                <div key={index}>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        {index + 1}. {q}
                    </label>
                    <input
                        type="text"
                        value={answers[index]}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder="Your answer..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-start transition-colors"
                        required
                    />
                </div>
            ))}
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-start text-white rounded-lg shadow-lg hover:bg-primary-start/80 transition-all duration-150 ease-in-out transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    disabled={answers.some(a => a.trim() === '')}
                >
                    <span>Submit Answers</span>
                    <PaperAirplaneIcon className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
};