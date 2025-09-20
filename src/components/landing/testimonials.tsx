import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    avatar: "/avatars/sarah.jpg",
    content: "SubTracker saved me over $200 last month by helping me identify subscriptions I forgot about. The interface is clean and the notifications are perfect.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Software Engineer",
    avatar: "/avatars/marcus.jpg", 
    content: "Finally, a subscription tracker that actually works! The analytics are incredibly detailed and the mobile app is fantastic. Highly recommend.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Manager",
    avatar: "/avatars/emily.jpg",
    content: "I was skeptical at first, but SubTracker has become essential for managing my business subscriptions. The export feature is a game-changer for accounting.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Small Business Owner",
    avatar: "/avatars/david.jpg",
    content: "The free tier gave me everything I needed to start, and upgrading to Premium was worth every penny. Customer support is also top-notch.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Content Creator",
    avatar: "/avatars/lisa.jpg",
    content: "Love how I can categorize my subscriptions and see spending trends. It's helped me budget better and make smarter decisions about which services to keep.",
    rating: 5,
  },
  {
    name: "Alex Rivera",
    role: "Student",
    avatar: "/avatars/alex.jpg",
    content: "As a student on a tight budget, SubTracker helps me keep track of all my streaming services and study tools. The free version is perfect for my needs.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <div id="testimonials" className="w-full py-12 xs:py-20 px-6 bg-muted/30">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight">
            Loved by thousands of users
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our users are saying about SubTracker and how it&apos;s helping them 
            save money and stay organized.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
