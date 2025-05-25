'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQsTwo() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'What is OnlyNerds?',
            answer: 'OnlyNerds is a decentralized learning platform where users can learn, create, and fork AI-powered courses. It rewards real progress with NFT badges and ensures transparency through blockchain and smart contracts.',
        },
        {
            id: 'item-2',
            question: 'How is OnlyNerds different from traditional e-learning platforms?',
            answer: 'Unlike traditional platforms, OnlyNerds uses smart contracts to manage AI tutors, payments, and reputation. Learners can fork courses like code, own their achievements as NFTs, and enjoy fair, pay-per-session pricing — all with full transparency.',
        },
        {
            id: 'item-3',
            question: 'What is “forking” a course?',
            answer: 'Forking a course means making a custom copy of it — just like forking code on GitHub. You can modify the content, structure, or AI tutor prompts and reshare or sell your version on the platform.',
        },
        {
            id: 'item-4',
            question: 'What do I get when I complete a course?',
            answer: "When you complete course milestones, you earn NFT badges that are verifiable, owned by you, and tied to your on-chain profile.",
        },
        {
            id: 'item-5',
            question: 'Is my data safe?',
            answer: 'Yes. We store only essential learning data, and all personal data stays in your control. No centralized server means no hidden tracking or data selling.',
        },
    ]

    return (
        <section className="py-8 md:py-12 bg-black mt-[-50px]">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl text-white">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground mt-4 text-balance">Discover quick and comprehensive answers to common questions about our platform, services, and features.</p>
                </div>

                <div className="mx-auto mt-12 max-w-xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="bg-card ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0">
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border-dashed">
                                <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-base">{item.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <p className="text-muted-foreground mt-6 px-8">
                        Can't find what you're looking for? Contact our{' '}
                        <Link
                            href="#"
                            className="text-primary font-medium hover:underline text-white">
                            customer support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}