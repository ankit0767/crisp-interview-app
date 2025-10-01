Crisp AI - AI-Powered Interview Assistant
Crisp AI is a sophisticated, AI-powered web application designed to automate the initial technical screening process for full-stack developer roles. It provides a seamless, timed interview experience for candidates and a comprehensive dashboard for interviewers to review and manage results.
Note: This project fulfills all requirements of the Swipe Internship Assignment. It was built with a focus on robustness, user experience, and professional design. While a full AI integration for dynamic question generation and summarization was successfully built and tested, this final version uses a stable, local interview flow to guarantee a flawless and reliable experience for evaluation.

Live Demo
https://crisp-interview-app.vercel.app/
Key Features
The application is split into two primary, synchronized views: the Interviewee chat and the Interviewer dashboard.

🧠 For the Interviewee (Candidate)
Premium User Interface: A clean, modern, and fully responsive UI designed for a professional user experience.

Resume Upload: Candidates can upload their resumes (PDF/DOCX) to begin the process.

Automatic Detail Extraction: The application automatically parses the resume to extract the candidate's Name, Email, and Phone Number.

Intelligent Onboarding Chatbot: If any details are missing, a friendly chatbot will ask for the required information and validate the inputs (e.g., ensuring an email is in the correct format).

Structured Timed Interview: A comprehensive 6-question interview is conducted, structured as:

2 Easy Questions (20 seconds each)

2 Medium Questions (60 seconds each)

2 Hard Questions (120 seconds each)

"Time's Up" Functionality: If a candidate runs out of time on a question, the system automatically submits "(Time ran out)" and moves to the next question.

Focused Interview Flow: Once the interview begins, the candidate is guided through the process without a "back" button to ensure the integrity of the assessment.

Pause & Resume: If the candidate closes the tab or refreshes the page, their in-progress interview is automatically saved. A "Welcome Back" modal allows them to resume exactly where they left off or start fresh.

📊 For the Interviewer (Recruiter)
Comprehensive Dashboard: A clean and functional dashboard that lists all completed candidate interviews.

Sortable Candidate List: The dashboard is automatically sorted by the highest score first. Interviewers can also sort the list alphabetically by candidate name.

Live Search: Interviewers can instantly filter the candidate list by typing a name or email into the search bar.

Detailed Interview View: By clicking on any candidate in the table, the interviewer can access a detailed report which includes:

The candidate's full profile (Name, Email, Phone).

The final calculated score.

A placeholder for the AI-generated summary.

The complete chat transcript of the entire interview.

Data Management: Interviewers can delete candidate records, with a confirmation step to prevent accidental deletions.

Tech Stack
This project was built using a modern and robust set of technologies:

Frontend: React.js

UI Library: Ant Design for a professional and consistent component library.

State Management: React Hooks (useState, useEffect, useCallback, useRef) for all local state management.

PDF Parsing: pdfjs-dist to extract text content directly from uploaded resume files.

Styling: Custom CSS for premium visual enhancements and responsiveness.

Deployment: Vercel for continuous integration and live hosting.

Getting Started
To run this project locally on your machine, please follow these steps:

1. Clone the Repository

git clone https://github.com/ankit0767/crisp-interview-app
cd crisp-interview-app


2. Install Dependencies

npm install


3. Run the Application

npm start


The application will open automatically in your browser at http://localhost:3000.
