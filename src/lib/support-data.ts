export interface FaqCategory {
    category: string;
    questions: {
        question: string;
        answer: string;
    }[];
}

export interface SupportTicket {
    id: string;
    subject: string;
    status: 'Open' | 'In Review' | 'Resolved';
    date: string;
}

export const faqData: FaqCategory[] = [
    {
        category: "Login & Security",
        questions: [
            { question: "I forgot my password. How can I reset it?", answer: "On the login screen, tap 'Forgot Password' and follow the on-screen instructions. You will need access to your registered email or phone number to receive a verification code." },
            { question: "How do I change my transaction PIN?", answer: "Go to the 'Security' section in the app settings. You will find an option to change your transaction PIN. You'll need to enter your old PIN to set a new one." },
        ]
    },
    {
        category: "Transfers",
        questions: [
            { question: "Why did my transfer fail?", answer: "A transfer can fail due to several reasons, including incorrect account details, insufficient funds, or network issues. Please check the details and try again. If the problem persists, contact support with the transaction reference." },
            { question: "What are the transfer limits?", answer: "Your daily transfer limit depends on your KYC tier. You can view and upgrade your tier in the 'Profile/KYC' section of the app." },
        ]
    },
    {
        category: "Bill Payment Issues",
        questions: [
            { question: "I paid a bill but the service is not restored.", answer: "Sometimes, it takes a few minutes for the biller's system to be updated. Please wait for up to 30 minutes. If the issue is not resolved, contact our support team with your transaction details." },
        ]
    }
];


export const supportTickets: SupportTicket[] = [
    { id: 'TKT-12345', subject: 'Failed Transfer to GTBank', status: 'Resolved', date: '2024-07-28' },
    { id: 'TKT-12346', subject: 'Unable to purchase airtime', status: 'In Review', date: '2024-07-30' },
    { id: 'TKT-12347', subject: 'Card was debited but POS transaction failed', status: 'Open', date: '2024-08-01' },
];
