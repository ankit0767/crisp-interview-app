import React, { useState, useRef, useEffect, useCallback } from 'react';
import { isValidEmail, isValidPhone } from './utils.js';
import { Layout, Card, Button, Typography, Input, Table, Modal, Space } from 'antd';
import { MessageOutlined, DashboardOutlined, DeleteOutlined } from '@ant-design/icons';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import './App.css';

// --- CONFIGURATION (Must be outside the component) ---

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const interviewQuestions = [
  { type: 'Easy', time: 20, text: "What is the purpose of a 'key' prop in React?" },
  { type: 'Easy', time: 20, text: "What is the difference between 'let' and 'const' in JavaScript?" },
  { type: 'Medium', time: 60, text: "Explain the concept of the virtual DOM in React." },
  { type: 'Medium', time: 60, text: "What are React Hooks? Name three common ones and their purpose." },
  { type: 'Hard', time: 120, text: "Describe a situation where you would use 'useMemo' and explain why it is useful." },
  { type: 'Hard', time: 120, text: "How would you handle global state management in a large React application? Discuss one approach." }
];

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  // --- STATE MANAGEMENT ---

  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [timer, setTimer] = useState(interviewQuestions[0].time);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState({ name: null, email: null, phone: null });
  const [detailToCollect, setDetailToCollect] = useState(null);
  const [completedInterviews, setCompletedInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null); // For delete confirmation

  // --- DERIVED STATE (for filtering the dashboard) ---

  const filteredInterviews = completedInterviews.filter(interview => {
    const name = interview.candidateDetails.name || '';
    const email = interview.candidateDetails.email || '';
    const lowercasedSearchText = searchText.toLowerCase();
    return (
      name.toLowerCase().includes(lowercasedSearchText) ||
      email.toLowerCase().includes(lowercasedSearchText)
    );
  });
  
  // --- DASHBOARD DELETE LOGIC ---

  const handleDeleteInterview = (interviewToDelete) => {
    const updatedInterviews = completedInterviews.filter(
      interview => interview.completedAt !== interviewToDelete.completedAt
    );
    setCompletedInterviews(updatedInterviews);
    localStorage.setItem('completedInterviews', JSON.stringify(updatedInterviews));
    setCandidateToDelete(null); // Close the confirmation modal
  };

  // --- TABLE COLUMNS (with sorters and delete action) ---

  const dashboardColumns = [
    { title: 'Candidate Name', dataIndex: ['candidateDetails', 'name'], key: 'name', render: (text) => text || 'N/A', sorter: (a, b) => (a.candidateDetails.name || '').localeCompare(b.candidateDetails.name || '') },
    { title: 'Email', dataIndex: ['candidateDetails', 'email'], key: 'email', render: (text) => text || 'N/A' },
    { title: 'Date Completed', dataIndex: 'completedAt', key: 'date', render: (text) => new Date(text).toLocaleString() },
    { title: 'Score', dataIndex: 'score', key: 'score', render: (score) => `${score} / 60`, sorter: (a, b) => a.score - b.score, defaultSortOrder: 'descend' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // This prevents the row's onClick from firing
              setCandidateToDelete(record); // Open the confirmation modal
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // --- CORE INTERVIEW LOGIC ---

  const askNextQuestion = useCallback((userAnswer = null) => {
    let currentMessages = [...messages];
    if (userAnswer) {
      currentMessages.push({ sender: 'user', text: userAnswer });
      // currentMessages.push({ sender: 'ai', text: "Thank you for your answer." });
    }
    const nextQuestionIndex = questionNumber;
    if (nextQuestionIndex >= interviewQuestions.length) {
      if (!interviewEnded) {
        const finalMessage = { sender: 'ai', text: "Thank you for your answers. The interview is now complete." };
        const finalMessages = [...currentMessages, finalMessage];
        const questionsWithKeys = interviewQuestions.map((q, i) => ({ ...q, keyPhrase: `Question ${i + 1}` }));
        let calculatedScore = 0;
        questionsWithKeys.forEach(question => {
          const questionIndexInChat = finalMessages.findIndex(msg => msg.sender === 'ai' && msg.text === question.text);
          if (questionIndexInChat !== -1 && questionIndexInChat < finalMessages.length - 1) {
            const nextMessage = finalMessages[questionIndexInChat + 1];
            if (nextMessage.sender === 'user' && nextMessage.text !== "(Time ran out)") {
              calculatedScore += 10;
            }
          }
        });
        const summary = `The candidate answered ${calculatedScore / 10} out of 6 questions before the time ran out. Further review is recommended.`;
        const interviewData = { candidateDetails, messages: finalMessages, completedAt: new Date().toISOString(), score: calculatedScore, summary };
        const updatedInterviews = [...completedInterviews, interviewData];
        setCompletedInterviews(updatedInterviews);
        localStorage.setItem('completedInterviews', JSON.stringify(updatedInterviews));
        localStorage.removeItem('inProgressInterview');
        setMessages(finalMessages);
        setInterviewEnded(true);
      }
      return;
    }
    const nextQuestionData = interviewQuestions[nextQuestionIndex];
    const aiQuestionMessage = { sender: 'ai', text: nextQuestionData.text };
    setTimeout(() => {
      const newMessages = [...currentMessages, aiQuestionMessage];
      setMessages(newMessages);
      setTimer(nextQuestionData.time);
      setQuestionNumber(prev => prev + 1);
      setIsTimeUp(false);
      localStorage.setItem('inProgressInterview', JSON.stringify({ messages: newMessages, questionNumber: questionNumber + 1, candidateDetails, detailToCollect }));
    }, userAnswer ? 1000 : 0);
  }, [messages, questionNumber, interviewEnded, candidateDetails, completedInterviews, detailToCollect]);

  // --- DETAIL COLLECTION & VALIDATION ---

  const handleDetailCollection = useCallback((answer) => {
    const updatedDetails = { ...candidateDetails };
    let nextMessages = [...messages, { sender: 'user', text: answer }];
    let nextDetail = detailToCollect;
    if (detailToCollect === 'email' && !isValidEmail(answer)) {
      nextMessages.push({ sender: 'ai', text: "That doesn't look like a valid email. Please provide a correct email address." });
    } else if (detailToCollect === 'phone' && !isValidPhone(answer)) {
      nextMessages.push({ sender: 'ai', text: "That doesn't look like a valid 10-digit phone number. Please try again." });
    } else {
      if (detailToCollect === 'name') updatedDetails.name = answer;
      if (detailToCollect === 'email') updatedDetails.email = answer;
      if (detailToCollect === 'phone') updatedDetails.phone = answer;
      setCandidateDetails(updatedDetails);
      if (!updatedDetails.name) {
        nextDetail = 'name';
        nextMessages.push({ sender: 'ai', text: "Thank you. What is your full name?" });
      } else if (!updatedDetails.email) {
        nextDetail = 'email';
        nextMessages.push({ sender: 'ai', text: "Got it. What is your email address?" });
      } else if (!updatedDetails.phone) {
        nextDetail = 'phone';
        nextMessages.push({ sender: 'ai', text: "Perfect. And finally, what is your phone number?" });
      } else {
        nextDetail = null;
        nextMessages.push({ sender: 'ai', text: "Great, I have all your details. Let's begin the interview." });
        askNextQuestion();
      }
    }
    setMessages(nextMessages);
    setDetailToCollect(nextDetail);
    localStorage.setItem('inProgressInterview', JSON.stringify({ messages: nextMessages, questionNumber, candidateDetails: updatedDetails, detailToCollect: nextDetail }));
  }, [candidateDetails, messages, detailToCollect, askNextQuestion, questionNumber]);
  
  // --- MAIN MESSAGE HANDLER ---

  const handleSendMessage = useCallback((isTimeout = false) => {
    if (isTimeout) { askNextQuestion("(Time ran out)"); return; }
    if (currentMessage.trim() === '') return;
    if (detailToCollect) { handleDetailCollection(currentMessage); } else { askNextQuestion(currentMessage); }
    setCurrentMessage('');
  }, [askNextQuestion, currentMessage, detailToCollect, handleDetailCollection]);

  // --- FILE & INTERVIEW STARTUP ---

  const handleStartInterview = () => {
    if (!candidateDetails.name) setDetailToCollect('name');
    else if (!candidateDetails.email) setDetailToCollect('email');
    else if (!candidateDetails.phone) setDetailToCollect('phone');
    setView('chat');
  };

  const handleUploadClick = () => { fileInputRef.current.click(); };

  const extractTextFromPdf = async (fileToProcess) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileToProcess);
    reader.onload = async () => {
      try {
        const pdfData = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        const details = { name: fullText.match(/^([A-Z][a-z]+)\s([A-Z][a-z]+)/)?.[0] || null, email: fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[0] || null, phone: fullText.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/)?.[0] || null };
        setCandidateDetails(details);
      } catch (error) { console.error('Failed to extract text from PDF:', error); }
    };
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) { setFile(uploadedFile); extractTextFromPdf(uploadedFile); }
  };

  // --- PAUSE/RESUME HANDLERS ---

  const handleResume = () => {
    const savedInProgress = localStorage.getItem('inProgressInterview');
    if (savedInProgress) {
      const parsedData = JSON.parse(savedInProgress);
      setMessages(parsedData.messages || []);
      setQuestionNumber(parsedData.questionNumber || 0);
      setCandidateDetails(parsedData.candidateDetails || { name: null, email: null, phone: null });
      setDetailToCollect(parsedData.detailToCollect || null);
      const lastQuestionIndex = parsedData.questionNumber > 0 ? parsedData.questionNumber - 1 : 0;
      setTimer(interviewQuestions[lastQuestionIndex]?.time || 20);
    }
    setShowWelcomeBackModal(false);
    setView('chat');
  };

  const handleStartNew = () => {
    localStorage.removeItem('inProgressInterview');
    setMessages([]); setQuestionNumber(0); setCandidateDetails({ name: null, email: null, phone: null }); setDetailToCollect(null); setInterviewEnded(false); setTimer(interviewQuestions[0].time); setIsTimeUp(false); setFile(null);
    setShowWelcomeBackModal(false);
  };

  // --- SIDE EFFECTS (useEffect Hooks) ---

  useEffect(() => {
    if (view === 'chat' && messages.length === 0) {
      if (detailToCollect) { setMessages([{ sender: 'ai', text: `It seems I'm missing some information. What is your full ${detailToCollect}?` }]); } else { askNextQuestion(); }
    }
  }, [view, messages.length, detailToCollect, askNextQuestion]);

  useEffect(() => {
    if (view !== 'chat' || interviewEnded || isTimeUp || detailToCollect) return;
    if (timer <= 0) { setIsTimeUp(true); handleSendMessage(true); return; }
    const intervalId = setInterval(() => { setTimer(prevTimer => prevTimer - 1); }, 1000);
    return () => clearInterval(intervalId);
  }, [view, timer, isTimeUp, interviewEnded, handleSendMessage, detailToCollect]);

  useEffect(() => {
    const savedCompleted = localStorage.getItem('completedInterviews');
    if (savedCompleted) { setCompletedInterviews(JSON.parse(savedCompleted)); }
    const savedInProgress = localStorage.getItem('inProgressInterview');
    if (savedInProgress) { setShowWelcomeBackModal(true); }
  }, []);

  // --- RENDER LOGIC ---

   const renderContent = () => {
    switch (view) {
      case 'chat':
        return (
          <Content className="responsive-content" style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
            <div className="responsive-container" style={{ width: '800px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
              {!interviewEnded && !detailToCollect && ( <div style={{ textAlign: 'center', marginBottom: '16px' }}><Typography.Title level={2}>Time Remaining: {timer}s</Typography.Title></div> )}
              <div style={{ flexGrow: 1, border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', marginBottom: '16px', overflowY: 'auto', backgroundColor: 'white' }}>
                {messages.map((msg, index) => ( <div key={index} style={{ marginBottom: '12px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}><div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '12px', backgroundColor: msg.sender === 'user' ? '#1890ff' : '#f0f0f0', color: msg.sender === 'user' ? 'white' : 'black', maxWidth: '70%' }}>{msg.text}</div></div> ))}
              </div>
              {!interviewEnded && ( <div style={{ display: 'flex', gap: '8px' }}><Input size="large" placeholder="Type your answer..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onPressEnter={() => handleSendMessage(false)} disabled={isTimeUp} /><Button type="primary" size="large" onClick={() => handleSendMessage(false)} disabled={isTimeUp}>Send</Button></div> )}
            </div>
          </Content>
        );
      case 'dashboard':
        return (
          <Content className="responsive-content" style={{ padding: '50px' }}>
            <div style={{ background: 'white', padding: 24, borderRadius: 8, overflowX: 'auto' }}>
              <Title level={2} style={{ marginBottom: 24 }}>Interviewer Dashboard</Title>
              <Input
                className="responsive-search"
                placeholder="Search by name or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ marginBottom: 24, width: '300px' }}
              />
              <Table
                columns={dashboardColumns}
                dataSource={filteredInterviews}
                rowKey="completedAt"
                onRow={(record) => ({ onClick: () => { setSelectedInterview(record); setView('detail'); } })}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </Content>
        );
      case 'detail':
        if (!selectedInterview) { return ( <Content className="responsive-content" style={{ padding: '50px' }}><p>No interview selected. <Button type="link" onClick={() => setView('dashboard')}>Go back to dashboard</Button></p></Content> ); }
        return (
          <Content className="responsive-content" style={{ padding: '50px' }}>
            <div style={{ background: 'white', padding: 24, borderRadius: 8 }}>
              <Button onClick={() => setView('dashboard')} style={{ marginBottom: 24 }}>&larr; Back to Dashboard</Button>
              <Title level={3}>Interview with: {selectedInterview.candidateDetails.name || 'N/A'}</Title>
              <p><strong>Email:</strong> {selectedInterview.candidateDetails.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedInterview.candidateDetails.phone || 'N/A'}</p>
              <Title level={4} style={{ marginTop: 24 }}>Final Score: {selectedInterview.score} / 60</Title>
              <p><strong>AI Summary:</strong> {selectedInterview.summary}</p>
              <hr style={{ margin: '24px 0' }} />
              <div style={{ height: '50vh', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                {selectedInterview.messages.map((msg, index) => ( <div key={index} style={{ marginBottom: '12px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}><div style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '12px', backgroundColor: msg.sender === 'user' ? '#1890ff' : '#f0f0f0', color: msg.sender === 'user' ? 'white' : 'black', maxWidth: '70%' }}>{msg.text}</div></div> ))}
              </div>
            </div>
          </Content>
        );
      case 'home':
      default:
        return (
          <Content className="responsive-content" style={{ padding: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
              <Title level={1} style={{ marginBottom: 10 }}>Welcome to Crisp AI</Title>
              <Typography.Text style={{ fontSize: '18px', color: '#555', marginBottom: 50, display: 'block' }}>Your intelligent assistant for conducting and managing technical interviews.</Typography.Text>
              <div className="home-cards-container" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: 40 }}>
                <Card className="premium-card" style={{ width: 350, textAlign: 'center' }} actions={[<Button type="primary" size="large" shape="round" onClick={handleStartInterview} disabled={!file}>Start Interview</Button>]}>
                  <Card.Meta avatar={<MessageOutlined style={{ fontSize: '48px', color: '#1890ff' }} />} title={<Title level={3}>For Interviewees</Title>} description="Upload your resume below to begin your automated screening interview." />
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.doc,.docx" />
                  <div style={{ marginTop: 30 }}>
                    {file ? ( <p>File Selected: <strong>{file.name}</strong></p> ) : ( <Button size="large" onClick={handleUploadClick}>Upload Resume</Button> )}
                  </div>
                </Card>
                <Card className="premium-card" style={{ width: 350, textAlign: 'center' }} actions={[<Button type="primary" size="large" shape="round" onClick={() => setView('dashboard')}>View Dashboard</Button>]}>
                  <Card.Meta avatar={<DashboardOutlined style={{ fontSize: '48px', color: '#52c_41a' }} />} title={<Title level={3}>For Interviewers</Title>} description="Access candidate results, review chat histories, and see AI-powered summaries." />
                </Card>
              </div>
            </div>
          </Content>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: 'white', borderBottom: '1.5px solid #f0f0f0', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#001529', lineHeight: '64px', float: 'left' }}>Crisp AI Assistant</Title>
      </Header>
      
      <Modal title="Welcome Back!" open={showWelcomeBackModal} closable={false} footer={[ <Button key="new" onClick={handleStartNew}>Start New</Button>, <Button key="resume" type="primary" onClick={handleResume}>Resume</Button> ]}>
        <p>You have an interview in progress. Would you like to resume where you left off?</p>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={!!candidateToDelete}
        onOk={() => handleDeleteInterview(candidateToDelete)}
        onCancel={() => setCandidateToDelete(null)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete the interview data for <strong>{candidateToDelete?.candidateDetails?.name || 'this candidate'}</strong>?</p>
        <p>This action cannot be undone.</p>
      </Modal>

      <div className="App-content">
        {renderContent()}
      </div>
    </Layout>
  );
}

export default App;

