import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does SubWise work?",
    answer: "SubWise helps you manage all your subscriptions in one place. Simply add your subscriptions manually or import them, and we'll track renewal dates, costs, and provide insights into your spending patterns."
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. We use bank-level encryption to protect your data. We never store your payment information or bank credentials. All data is encrypted both in transit and at rest."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your Plus subscription at any time. There are no long-term contracts or cancellation fees. Your account will remain active until the end of your current billing period."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains accessible for 30 days after cancellation. You can export all your subscription data during this period. After 30 days, your data is permanently deleted from our servers."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day free trial for Plus features. If you're not satisfied within the first 7 days of your paid subscription, we'll provide a full refund."
  },
  {
    question: "How do I add subscriptions?",
    answer: "You can add subscriptions manually by entering the service name, cost, and billing cycle. We're also working on features to automatically detect subscriptions from your bank statements."
  },
  {
    question: "Can I track family or shared subscriptions?",
    answer: "Yes! You can add any subscription regardless of who pays for it. This is perfect for tracking family plans, shared services, or subscriptions you split with others."
  },
  {
    question: "What currencies do you support?",
    answer: "We support all major currencies including USD, EUR, GBP, CAD, AUD, and many more. You can track subscriptions in different currencies and we'll handle the conversions."
  }
];

export const FAQ = () => {
  return (
    <div id="faq" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-lg mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight font-sans">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Got questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for, 
            feel free to reach out to our support team.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
