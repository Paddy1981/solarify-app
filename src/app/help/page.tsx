
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, UserCircle, Home, Wrench, Store, ShoppingCart, Settings, Mail } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const faqSections = [
    {
      title: "Getting Started",
      icon: <UserCircle className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "How do I sign up for Solarify?",
          answer: "Click on the 'Sign Up' button in the header. You'll need to provide your full name, email, password, choose your role (Homeowner, Installer, or Supplier), and set your location and preferred currency."
        },
        {
          question: "How do I log in?",
          answer: "Click on the 'Login' button in the header and enter your registered email and password."
        },
        {
          question: "I forgot my password. What should I do?",
          answer: "Firebase Authentication handles password resets. Typically, on the login page, there would be a 'Forgot Password?' link that initiates this process (this link is not yet implemented in the current mock login form but is a standard Firebase Auth feature)."
        },
        {
          question: "How do I change my user role?",
          answer: "Currently, your user role is set at signup. If you need to change your role (e.g., from Homeowner to Installer), you may need to create a new account with the correct role or contact support for assistance in a production environment. In this demo, you can sign up with a new email for a different role."
        }
      ]
    },
    {
      title: "For Homeowners",
      icon: <Home className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "How does the Energy Needs Calculator work?",
          answer: "Navigate to 'Energy Needs Calculator' from your dashboard or the 'For Homeowners' menu. Input your common household appliances, their wattage (many are pre-filled), quantity, and average daily hours of use. The calculator will estimate your daily and monthly energy consumption (kWh) and suggest a suitable solar system size (kW)."
        },
        {
          question: "What information do I need for the Savings Estimator?",
          answer: "For the 'Savings Potential Estimator', you'll need your current average monthly electricity bill, the estimated total cost of solar panel installation, your average monthly electricity consumption in kWh, your property's location (city, state), roof orientation (e.g., South-facing), and the amount of shading on your roof (None, Partial, Full)."
        },
        {
          question: "How do I generate an RFQ (Request for Quotation)?",
          answer: "Go to 'Generate RFQ' from your dashboard or menu. Your details will be pre-filled. Enter your estimated solar requirements and select up to three installers from the list to send your RFQ to. This is a simulated process in the current version."
        },
        {
          question: "Where can I see the RFQs I've created and their status?",
          answer: "On your Homeowner Dashboard, there's a section titled 'My Requests for Quotation'. This lists all RFQs you've generated, showing their status (e.g., Pending, Responded, Closed) and links to view details or received quotes (simulated)."
        },
        {
          question: "How do I set up my dashboard if I have an existing solar system?",
          answer: "When you first visit your dashboard, you'll be asked if you have an existing system. If you select 'Yes', you'll be guided to a form to input your system's size (kWp), installation date, and location. This will configure your dashboard to show performance data (currently mock data)."
        },
        {
          question: "What if I'm new to solar?",
          answer: "If you select 'I'm New to Solar' on your initial dashboard visit, you'll see a specialized dashboard guiding you through resources like the Energy Needs Calculator, Savings Estimator, and how to generate an RFQ to start your solar journey."
        }
      ]
    },
    {
      title: "For Installers",
      icon: <Wrench className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "How do I add projects to my portfolio?",
          answer: "From your Installer Dashboard, navigate to 'My Portfolio', then click 'Add New Project'. You can fill in details like project title, description, location, completion date, system size, and an image URL."
        },
        {
          question: "How do I view and respond to RFQs?",
          answer: "On your Installer Dashboard, go to 'View RFQs'. This page lists RFQs sent to you by homeowners. Click on an RFQ card to 'Generate Quote'."
        },
        {
          question: "How do I generate a quote for an RFQ?",
          answer: "After selecting an RFQ, you'll be taken to the 'Generate Quote' page. Here, you can add line items (products/services, quantity, price), set tax rates, add notes, and specify terms. The quote will be in your profile's currency. This is a simulated process."
        }
      ]
    },
    {
      title: "For Suppliers",
      icon: <Store className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "How do I add products to my store?",
          answer: "From your Supplier Dashboard, navigate to 'Manage Storefront' and then find the option or link to 'Add Product' (typically `/supplier/store/add-product`). You'll fill out product name, price (in your currency), stock, category, description, and image URL."
        },
        {
          question: "How can users find my products?",
          answer: "Your products will be listed on the main 'Shop' page (`/supplier/store`) accessible to all users. Users can browse or search for products there."
        }
      ]
    },
    {
      title: "General Questions",
      icon: <ShoppingCart className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "How does the shopping cart work?",
          answer: "When browsing products in the 'Shop', you can add items to your cart. On the 'Cart' page (`/cart`), you can review items, change quantities, remove items, and proceed to a simulated checkout."
        },
        {
          question: "How do I update my profile settings?",
          answer: "Click on 'Settings' from your role-specific dropdown menu in the header. You can update your name, location, currency, phone, avatar, and company-specific details if applicable."
        },
        {
          question: "Where can I see promotions?",
          answer: "Navigate to the 'Promotions' page from the header. This hub displays offers and announcements from Solarify installers and suppliers."
        }
      ]
    },
    {
      title: "Troubleshooting",
      icon: <HelpCircle className="w-6 h-6 text-accent" />,
      faqs: [
        {
          question: "Why is some data (like RFQs or projects) not appearing as expected?",
          answer: "This application uses mock data for many features. If you're testing and have signed up with an email that matches a pre-defined mock user, ensure you're logged in correctly. For development, sometimes clearing your browser's cache and localStorage for this site and logging in again can help resolve inconsistencies with mock user profiles."
        },
        {
          question: "I'm seeing an error message, what should I do?",
          answer: "First, try refreshing the page. If the error persists, note down any specific error codes or messages. As this is a demo application, some features are simulated. If you encounter persistent issues, it's likely a part of the ongoing development."
        }
      ]
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline">Solarify Help & Support</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Find answers to common questions about using Solarify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {faqSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-headline mb-4 flex items-center">
                {section.icon}
                <span className="ml-3">{section.title}</span>
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {section.faqs.map((faq, index) => (
                  <AccordionItem value={`item-${section.title.replace(/\s+/g, '-')}-${index}`} key={index} className="bg-muted/30 rounded-md px-4 shadow-sm">
                    <AccordionTrigger className="text-left hover:no-underline text-base font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-foreground/80 pt-1 pb-3">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <div className="pt-8 text-center border-t">
             <h2 className="text-2xl font-headline mb-3 flex items-center justify-center">
                <Mail className="w-6 h-6 text-accent mr-3" />
                Still Need Help?
              </h2>
            <p className="text-muted-foreground">
              If you can't find the answer you're looking for, please feel free to reach out to our support team (this is a placeholder, actual contact method would be here).
            </p>
            <p className="text-sm mt-2">For issues related to your Firebase account or password resets not initiated via an app link, please refer to standard Firebase support channels.</p>
            <Link href="/" className="text-primary hover:underline mt-4 inline-block">
                Go back to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
