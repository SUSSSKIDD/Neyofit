// src/pages/TermsAndPolicies.jsx
import React from 'react';
import { combinedTermsAndPolicies } from './data/combinedTermsAndPolicies'; // adjust path if needed
import AnimatedNavbar from '@/components/animated-navbar';
import Navbar from '@/components/navbar';

// Typescript users can import Clause type if you have it declared// src/types/Clause.ts
export interface Clause {
    /** Serial number for ordering */
    number: number;

    /** Title of the clause, e.g. "Cancellation Policy" */
    title: string;

    /** Optional style hint for UI (e.g., 'number', 'disc', 'none') */
    style?: 'number' | 'disc' | 'none' | string;

    /**
     * Points can be:
     *  - a simple string,
     *  - or a nested object with its own heading and an array of sub-points.
     */
    points: Array<
        | string
        | {
            heading: string;
            style?: 'number' | 'disc' | 'none' | string;
            points: string[];
        }
    >;
}


export default function TermsAndPolicies() {
    // Separate into two groups based on number (1-7 are Terms, 8+ are Policies)
    const terms = combinedTermsAndPolicies.filter(item => item.number <= 7);
    const policies = combinedTermsAndPolicies.filter(item => item.number > 7);

    const renderClause = (clause: Clause) => (
        <div key={clause.number} className="mb-6">

            <h3 className="text-lg font-semibold mb-2">
                {clause.number}. {clause.title}
            </h3>
            <ul className="list-decimal list-inside space-y-1 text-gray-700">
                {clause.points.map((point, idx) => {
                    // Handle nested objects with heading + sub-points
                    if (typeof point === 'string') {
                        return <li key={idx}>{point}</li>;
                    }
                    if (typeof point === 'object' && point.heading) {
                        return (
                            <li key={idx}>
                                <strong>{point.heading}</strong>
                                {Array.isArray(point.points) && (
                                    <ul className="list-disc list-inside ml-5 space-y-1">
                                        {point.points.map((sub, sIdx) => (
                                            <li key={sIdx}>{sub}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        </div>
    );

    return (
        <>
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900">
                <h1 className="text-3xl font-bold mb-10 text-center">
                    Terms & Conditions and Policies
                </h1>

                {/* Terms Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 border-b border-gray-300 pb-2">
                        Terms & Conditions
                    </h2>
                    {terms.map(renderClause)}
                </section>

                {/* Policies Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b border-gray-300 pb-2">
                        Policies
                    </h2>
                    {policies.map(renderClause)}
                </section>
            </main>
        </>
    );
}
